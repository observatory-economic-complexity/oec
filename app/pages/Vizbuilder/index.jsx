import React from "react";
import throttle from "@datawheel/canon-cms/src/utils/throttle";
import {connect} from "react-redux";
import {withNamespaces} from "react-i18next";
import OECNavbar from "components/OECNavbar";
import Footer from "components/Footer";

import "./Vizbuilder.css";
import VbTabs from "../../components/VbTabs";
import VbChart from "../../components/VbChart";
import VirtualSelector from "../../components/VirtualSelector";
import {Client} from "@datawheel/olap-client";
import OECMultiSelect from "../../components/OECMultiSelect";
import VbTitle from "../../components/VbTitle";

import colors from "../../helpers/colors";


const datasets = [
  {value: "hs92", title: "HS92"},
  {value: "hs96", title: "HS96"},
  {value: "hs02", title: "HS02"},
  {value: "hs07", title: "HS07"},
  {value: "sitc", title: "SITC"},
  {value: "cpc", title: "Technology"}
];

const flow = [
  {value: "export", title: "Exports"},
  {value: "import", title: "Imports"}
];

const years = [...Array(56).keys()].map(d => ({value: 2017 - d, title: 2017 - d}));

class Vizbuilder extends React.Component {
  constructor(props) {
    super(props);
    const {params} = this.props;

    this.state = {
      activeTab: params ? params.chart : "tree_map",
      country: [],
      product: [],
      technology: [],

      _product: undefined,
      _country: undefined,
      _countryId: "all",
      _dataset: datasets[0],
      _flow: flow[0],
      _partner: undefined,
      _partnerId: "all",
      _year: undefined,
      _yearId: "2017",
      scrolled: false,

      _selectedItemsProduct: [],
      _selectedItemsCountry: [],
      _selectedItemsPartner: [],
      _selectedItemsTechnology: [],
      _selectedItemsYear: []
    };
  }


  componentDidMount() {
    const {routeParams} = this.props;
    const {country, partner, time, viztype} = routeParams;
    window.addEventListener("scroll", this.handleScroll);

    Client.fromURL("https://api.oec.world/tesseract")
      .then(client => client.getCube("trade_i_baci_a_92").then(cube => {
        const query = cube.query;
        query.addMeasure("Trade Value");
        return client.getMembers({level: "HS4"});

      }))
      .then(data => {
        this.setState({product: data.map(d => ({value: d.key, title: d.name, color: colors.Section[d.key.toString().slice(0, -4)]}))});
      });

    Client.fromURL("https://api.oec.world/tesseract")
      .then(client => client.getCube("patents_i_uspto_w_cpc").then(cube => {
        const query = cube.query;
        query.addMeasure("Patent Share");
        return client.getMembers({level: "Subclass"});

      }))
      .then(data => {
        this.setState({technology: data.map(d => ({value: d.key, title: d.name, color: colors["CPC Section"][d.key[0]]}))});
      });

    Client.fromURL("https://api.oec.world/tesseract")
      .then(client => client.getCube("trade_i_baci_a_92").then(cube => {
        const query = cube.query;
        query.addMeasure("Trade Value");
        return client.getMembers({level: "Exporter Country"});

      }))
      .then(data => {
        const countryData = data.map(d => ({
          value: d.key,
          title: d.name,
          color: colors.Continent[d.key.slice(0, 2)]
        }));
        const _selectedItemsCountry = countryData
          .filter(d => country.split(".").includes(d.value.slice(2, 5)));
        const _selectedItemsPartner = countryData
          .filter(d => partner.split(".").includes(d.value.slice(2, 5)));
        const _selectedItemsYear = years
          .filter(d => time.split(".").includes(d.value.toString()));
        const _selectedItemsProduct = this.state.product
          .filter(d => viztype.split(".").includes(d.value.toString()));
        this.setState({
          country: countryData,
          _selectedItemsCountry,
          _selectedItemsPartner,
          _selectedItemsProduct,
          _selectedItemsYear
        });
      });

  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  }

  handleScroll = () => {
    throttle(() => {
      if (window.scrollY > 220) {
        this.setState({scrolled: true});
      }
      else {
        this.setState({scrolled: false});
      }
    }, 30);
  };

  handleTabOption = d => {
    const {router} = this.props;
    this.setState(d);
    router.push(d.permalink);
  }

  buildViz = () => {
    const {router} = this.props;
    const {
      activeTab,
      _countryId,
      _flow,
      _yearId,
      _dataset,
      _selectedItemsCountry,
      _selectedItemsPartner,
      _selectedItemsYear,
      _selectedItemsProduct,
      _selectedItemsTechnology
    } = this.state;

    const countryIds = _selectedItemsCountry.map(d => d.value.slice(2, 5)).join(".");
    const partnerIds = _selectedItemsPartner && _selectedItemsPartner.length > 0
      ? _selectedItemsPartner.map(d => d.value.slice(2, 5)).join(".")
      : "all";

    const productId = _dataset.value === "cpc"
      ? _selectedItemsTechnology.length > 0
        ? _selectedItemsTechnology.map(d => d.value).join(".")
        : "show"
      : _selectedItemsProduct.length > 0
        ? _selectedItemsProduct.map(d => d.value).join(".")
        : "show";


    const permalink = `/en/visualize/tree_map/${_dataset.value}/${_flow.value}/${countryIds}/${partnerIds}/${productId}/${_selectedItemsYear.map(d => d.value).join(".")}/`;
    this.setState({permalink});
    router.push(permalink);
  };

  updateFilter = (key, value) => {
    this.setState({
      [key]: value,
      [`${key}Id`]: value.value
    });
  };

  handleItemMultiSelect = (key, d) => {
    this.setState({[key]: d});
  }

  render() {
    const {activeTab, scrolled} = this.state;
    const {routeParams, t} = this.props;
    const {chart, cube} = routeParams;

    const isTrade = cube.includes("hs");
    const isTechnology = !isTrade;

    return <div id="vizbuilder">
      <OECNavbar
        className={scrolled ? "background" : ""}
        title={"Hello"}
        scrolled={scrolled}
      />

      <div className="vb-profile">
        <div className="vb-columns">
          <div className="vb-column aside">
            <VbTabs
              activeOption={this.props.location.pathname}
              activeTab={activeTab}
              callback={d => this.handleTabOption(d)}
            />

            {!["network"].includes(chart) && isTrade && <div className="columns">
              <div className="column-1">
                <OECMultiSelect
                  items={this.state.product}
                  selectedItems={this.state._selectedItemsProduct}
                  title={"Product"}
                  callback={d => this.handleItemMultiSelect("_selectedItemsProduct", d)}
                />
              </div>
            </div>}

            {!["network"].includes(chart) && isTechnology && <div className="columns">
              <div className="column-1">
                <OECMultiSelect
                  items={this.state.technology}
                  selectedItems={this.state._selectedItemsTechnology}
                  title={"Technology"}
                  callback={d => this.handleItemMultiSelect("_selectedItemsTechnology", d)}
                />
              </div>
            </div>}

            <div className="columns">
              <div className="column-1">
                <OECMultiSelect
                  items={this.state.country}
                  itemType={"country"}
                  selectedItems={this.state._selectedItemsCountry}
                  title={"Country"}
                  callback={d => this.handleItemMultiSelect("_selectedItemsCountry", d)}
                />
              </div>
            </div>

            {!["network", "rings"].includes(chart) && <div className="columns">
              <div className="column-1">
                <OECMultiSelect
                  items={this.state.country}
                  itemType="country"
                  selectedItems={this.state._selectedItemsPartner}
                  title={"Partner"}
                  callback={d => this.handleItemMultiSelect("_selectedItemsPartner", d)}
                />
              </div>
            </div>}

            <div className="columns">
              <div className="column-1-2">
                <VirtualSelector
                  items={datasets}
                  title={"Dataset"}
                  state="_dataset"
                  selectedItem={this.state._dataset}
                  run={this.updateFilter}
                />
              </div>

              <div className="column-1-2">
                <VirtualSelector
                  items={flow}
                  title={"Trade Flow"}
                  state="_flow"
                  selectedItem={this.state._flow}
                  run={this.updateFilter}
                />

              </div>
            </div>

            <div className="columns">
              <div className="column-1">
                <OECMultiSelect
                  items={years}
                  selectedItems={this.state._selectedItemsYear}
                  title={"Year"}
                  callback={d => this.handleItemMultiSelect("_selectedItemsYear", d)}
                />
              </div>
            </div>

            <div className="columns">
              <div className="column-1 tab">
                <button
                  className="button build click"
                  onClick={() => this.buildViz()}
                >
                  {t("Build Visualization")}
                </button>
              </div>
            </div>
          </div>
          <div className="vb-column">
            <VbTitle
              countryData={this.state.country}
              routeParams={routeParams}
            />
            <VbChart
              countryData={this.state.country}
              permalink={this.state.permalink}
              routeParams={routeParams}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>;
  }
}

export default withNamespaces()(connect()(Vizbuilder));
