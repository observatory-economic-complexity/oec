import React from "react";
import {hot} from "react-hot-loader/root";
import PropTypes from "prop-types";
import axios from "axios";
import {connect} from "react-redux";
import {withNamespaces} from "react-i18next";
import queryString from "query-string";

import OECNavbar from "components/OECNavbar";
import Footer from "components/Footer";
import SearchMultiSelect from "components/SearchMultiSelect";
import PredictionViz from "pages/Prediction/PredictionViz";
import AdvParamPanel from "pages/Prediction/AdvParamPanel";
import PredictionTable from "pages/Prediction/PredictionTable";
import {DEFAULT_PREDICTION_COLOR, PREDICTION_DATASETS} from "helpers/consts";
import "./Prediction.css";
import {Alignment, AnchorButton, Button, Collapse, Navbar, Tabs, Tab} from "@blueprintjs/core";

class Prediction extends React.Component {

  constructor(props) {
    super();
    const parsedQueryString = queryString.parse(props.router.location.search, {arrayFormat: "comma"});
    this.state = {
      activeTabId: null,
      advParams: [{
        changepointPriorScale: 0.05,
        changepointRange: 0.80,
        seasonalityMode: "multiplicative"
      }],
      currentDrilldown: null,
      dataset: parsedQueryString.dataset
        ? PREDICTION_DATASETS.find(d => d.slug === parsedQueryString.dataset) || PREDICTION_DATASETS[0]
        : PREDICTION_DATASETS[0],
      datasetSelections: [],
      datatableOpen: false,
      destinations: [],
      drilldowns: [],
      error: false,
      loading: false,
      origins: [],
      predictionData: [],
      products: [],
      scrolled: false,
      updateKey: null
    };
  }

  componentDidMount() {
    window.addEventListener("scroll", this.handleScroll);
    const {dataset} = this.state;
    const selectionApiUrls = dataset.selections.map(d => axios.get(d.dataUrl));
    const parsedQueryString = queryString.parse(this.props.router.location.search, {arrayFormat: "comma"});
    let drillDownFound = false;
    axios.all(selectionApiUrls)
      .then(axios.spread((...responses) => {

        // populate dropdowns
        responses.forEach((resp, i) => {
          const {data} = resp.data;
          const selectionId = dataset.selections[i].id;
          drillDownFound = parsedQueryString.drilldown === selectionId || drillDownFound;
          const thisSelectionQParams = parsedQueryString[selectionId];
          dataset.selections[i].data = data
            .map(dataset.selections[i].dataMap)
            .sort((a, b) => a.name.localeCompare(b.name));
          dataset.selections[i].data.forEach(d => {
            if (thisSelectionQParams && thisSelectionQParams.includes(`${d.id}`)) {
              dataset.selections[i].selected.push(d);
            }
          });
        });
        dataset.selectionsLoaded = true;

        // read query params to determine if there are selections
        // const qSelections = [["origins", "sachl"], ["destinations", "nausa"]];
        // qSelections.forEach(qs => {
        //   const selectionSlug = qs[0];
        //   const selectionDataId = qs[1];
        //   const thisSelection = dataset.selections.find(s => s.id === selectionSlug);
        //   const x = thisSelection.data.find(d => d.id === selectionDataId);
        //   thisSelection.selected.push(x);
        // });

        const currentDrilldown = drillDownFound ? parsedQueryString.drilldown : null;
        this.setState({dataset, currentDrilldown}, this.buildPrediction);
      }));
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  }

  handleScroll = () => {
    if (window.scrollY > 5) {
      this.setState({scrolled: true});
    }
    else {
      this.setState({scrolled: false});
    }
  };

  updateSelection = selectionId => newItems => {
    // selectionId is the argument you passed to the function
    // newItems is the array returned
    const {dataset} = this.state;
    let {advParams, currentDrilldown} = this.state;
    const {router} = this.context;
    const datasetSelections = dataset.selections.map(selection => {
      if (selection.id === selectionId) {
        selection.selected = newItems;
        // if deleting items and new selected array is empty
        // we need to turn off the drilldown toggle for this selection
        // and reset the advanced parameters
        if (selection.selected.length === 0 && selection.id === currentDrilldown) {
          currentDrilldown = null;
          advParams = [{
            changepointPriorScale: 0.05,
            changepointRange: 0.80,
            seasonalityMode: "multiplicative"
          }];
        }
      }
      return selection;
    });
    dataset.selections = datasetSelections;
    // set query params for this selection
    const queryArgs = queryString.parse(this.props.router.location.search, {arrayFormat: "comma"});
    queryArgs[selectionId] = newItems.map(d => d.id);
    const stringifiedQueryArgs = queryString.stringify(queryArgs, {arrayFormat: "comma"});
    router.replace(`/en/prediction/?${stringifiedQueryArgs}`);
    this.setState({advParams, currentDrilldown, dataset});
  };

  grabIds = item => item.id;

  buildPrediction = () => {
    this.setState({error: false, loading: true});
    const {currentDrilldown, dataset} = this.state;
    let myAdvParamStrings = [];
    const advParams = this.state.advParams && this.state.advParams.length
      ? this.state.advParams
      : [{
        changepointPriorScale: 0.05,
        changepointRange: 0.80,
        seasonalityMode: "multiplicative"
      }];
    const advParamStrings = advParams.map(advParam => `&seasonality_mode=${advParam.seasonalityMode}&changepoint_prior_scale=${advParam.changepointPriorScale}&changepoint_range=${advParam.changepointRange}`);
    const updateKey = advParams.map(advParam => `sm-${advParam.seasonalityMode}-cps-${advParam.changepointPriorScale}-cr-${advParam.changepointRange}`);
    // step 1: build api URLs
    const apiUrlRoot = `/api/predict?cube=${dataset.cube}&drilldowns=${dataset.dateDrilldown}&measures=Trade+Value`;
    let apiUrls = [apiUrlRoot];
    let drilldowns = [{name: "Aggregate", color: DEFAULT_PREDICTION_COLOR, id: "xx"}];
    // Are there any drilldowns?
    const drillSelection = dataset.selections.find(s => s.id === currentDrilldown);
    if (drillSelection) {
      apiUrls = [];
      drilldowns = drillSelection.selected.slice();
      myAdvParamStrings = advParams.length === drilldowns.length ? advParamStrings : drilldowns.map(() => `&seasonality_mode=${advParams[0].seasonalityMode}&changepoint_prior_scale=${advParams[0].changepointPriorScale}&changepoint_range=${advParams[0].changepointRange}`);
      // first get all non drilldown selections:
      const nonDrillSelections = dataset.selections.filter(s => s.id !== currentDrilldown);
      let drillApiUrlBase = `${apiUrlRoot}`;
      nonDrillSelections.forEach(s => {
        if (s.selected.length) {
          drillApiUrlBase = `${drillApiUrlBase}&${s.dimName}=${s.selected.map(this.grabIds)}`;
        }
      });
      drillSelection.selected.forEach((s, i) => {
        apiUrls.push(`${drillApiUrlBase}&${drillSelection.dimName}=${s.id}${myAdvParamStrings[i]}`);
      });
    }
    else {
      let selectionCount = 0;
      let singlePotentialDrilldown = null;
      dataset.selections.forEach(selection => {
        if (selection.selected.length) {
          selectionCount += selection.selected.length;
          singlePotentialDrilldown = selection.selected[0];
          apiUrls[0] = `${apiUrls[0]}&${selection.dimName}=${selection.selected.map(this.grabIds)}`;
        }
      });
      if (selectionCount === 1) {
        drilldowns = [singlePotentialDrilldown];
      }
      apiUrls[0] = `${apiUrls[0]}${advParamStrings[0]}`;
    }
    // console.log("apiUrls!", apiUrls);
    // Step 2: make XHR requests:
    axios.all(apiUrls.map(url => axios.get(url)))
      .then(axios.spread((...responses) => {
        let allResults = [];
        const errors = [];
        const newAdvParams = [];
        responses.forEach((resp, i) => {
          console.log("resp.data", resp.data);
          if (resp.data.error) {
            errors.push(resp.data);
          }
          else {
            allResults = allResults.concat(resp.data.data.map(d => ({...d, Drilldown: drilldowns[i]})));
            newAdvParams.push({
              changepointPriorScale: parseFloat(resp.data.params.changepoint_prior_scale),
              changepointRange: parseFloat(resp.data.params.changepoint_range),
              seasonalityMode: resp.data.params.seasonality_mode
            });
          }
        });
        if (errors.length === apiUrls.length) {
          this.setState({activeTabId: drilldowns[0].id, drilldowns, loading: false, error: true});
        }
        else {
          this.setState({activeTabId: drilldowns[0].id, advParams: newAdvParams, drilldowns, loading: false, error: false, predictionData: allResults || [], updateKey: updateKey.join(",")});
        }
      }));
  }

  toggleAdvControls = () => this.setState({advControlIsOpen: !this.state.advControlIsOpen});

  toggleDrilldown = selectorType => e => {
    // first check if any items have been added:
    const {currentDrilldown, dataset} = this.state;
    const {router} = this.context;
    let newDrilldown = currentDrilldown;
    const drillSelection = dataset.selections.find(s => s.id === selectorType);
    if (drillSelection.selected.length) {
      newDrilldown = e.target.checked ? selectorType : null;
    }
    this.setState({currentDrilldown: newDrilldown});

    // set query params for this selection
    const queryArgs = queryString.parse(this.props.router.location.search, {arrayFormat: "comma"});
    queryArgs.drilldown = newDrilldown;
    const stringifiedQueryArgs = queryString.stringify(queryArgs, {arrayFormat: "comma"});
    router.replace(`/en/prediction/?${stringifiedQueryArgs}`);
  };

  handleControlTabChange = newTabId => this.setState({activeTabId: newTabId})

  toggleDatatable = () => this.setState({datatableOpen: !this.state.datatableOpen})

  updateAdvParams = index => newParams => {
    const {advParams} = this.state;
    advParams[index] = newParams;
    this.setState({advParams});
  }

  render() {
    const {activeTabId, currentDrilldown, dataset, datatableOpen,
      drilldowns, error, loading, predictionData, scrolled, updateKey} = this.state;

    return <div className="prediction" onScroll={this.handleScroll}>
      <OECNavbar
        className={scrolled ? "background" : ""}
        title={scrolled ? "Predictions" : ""}
      />

      <div className="welcome">
        {/* spinning orb thing */}
        <div className="welcome-bg">
          <img className="welcome-bg-img" src="/images/stars.png" alt="" draggable="false" />
        </div>

        {/* entity selection form */}
        <div className="prediction-container-outer">

          <Navbar>
            <Navbar.Group align={Alignment.LEFT}>
              <Navbar.Heading>
                <h1>Predictions</h1>
              </Navbar.Heading>
              <Navbar.Divider />
              {PREDICTION_DATASETS.map(dset =>
                <AnchorButton
                  href={`?dataset=${dset.slug}`}
                  key={dset.slug}
                  active={dataset.slug === dset.slug}
                  className="bp3-minimal"
                  icon="timeline-line-chart"
                  text={dset.name} />
              )}
            </Navbar.Group>
          </Navbar>

          {/* prediction selection dropdowns */}
          <div className="prediction-controls">
            {dataset.selectionsLoaded
              ? dataset.selections.map(selection =>
                <SearchMultiSelect
                  key={selection.id}
                  updateSelection={this.updateSelection(selection.id)}
                  initialItems={selection.selected}
                  isDrilldown={currentDrilldown === selection.id ? true : false}
                  itemType={selection.name}
                  items={selection.data}
                  toggleDrilldown={this.toggleDrilldown(selection.id)} />)
              : null}
            <Button className="build-prediction-btn" rightIcon="arrow-right" text="Build" minimal={true} onClick={this.buildPrediction} />
          </div>

          {/* prediction viz line chart */}
          <div className="prediction-viz-container">
            {predictionData.length
              ? <PredictionViz
                data={predictionData}
                error={error}
                loading={loading}
                updateKey={updateKey}
                currencyFormat={dataset.currencyFormat}
              />
              : null}
          </div>

          {/* prediction advanced controls */}
          <div className="prediction-controls-container">
            {drilldowns.length
              ? <Tabs animate={true} id="ControlTabs" onChange={this.handleControlTabChange} selectedTabId={activeTabId} renderActiveTabPanelOnly={false}>
                {drilldowns.map((drill, index) => <Tab key={drill.id} id={drill.id} title={drill.name} panel={<AdvParamPanel updateAdvParams={this.updateAdvParams(index)} />} />)}
              </Tabs>
              : null}
          </div>

          {/* prediction data table */}
          <div className="prediction-datatable-container">
            <Button onClick={this.toggleDatatable} minimal={false} icon={"th"}>
              {datatableOpen ? "Hide" : "Show"} Data Table
            </Button>
            <Collapse isOpen={datatableOpen}>
              <PredictionTable
                data={predictionData}
                error={error}
                loading={loading}
                currencyFormat={dataset.currencyFormat}
              />
            </Collapse>
          </div>

        </div>

      </div>

      <Footer />
    </div>;
  }
}


Prediction.need = [
];

Prediction.contextTypes = {
  formatters: PropTypes.object,
  router: PropTypes.object
};


export default hot(withNamespaces()(
  connect(state => ({
    formatters: state.data.formatters,
    locale: state.i18n.locale
  }))(Prediction)
));
