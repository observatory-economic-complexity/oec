import React from "react";
import {hot} from "react-hot-loader/root";
import PropTypes from "prop-types";

import {fetchData} from "@datawheel/canon-core";
import {connect} from "react-redux";
import {withNamespaces} from "react-i18next";

import libs from "@datawheel/canon-cms/src/utils/libs";
import {Profile as CMSProfile} from "@datawheel/canon-cms";
import Navbar from "components/Navbar";

import Footer from "../../components/Footer";
import "./Profile.css";

class Profile extends React.Component {
  state = {
    scrolled: false
  };

  getChildContext() {
    const {formatters, locale, profile, router} = this.props;
    const {variables} = profile;

    return {
      formatters: formatters.reduce((acc, d) => {
        const f = Function("n", "libs", "formatters", d.logic);
        const fName = d.name.replace(/^\w/g, chr => chr.toLowerCase());
        acc[fName] = n => f(n, libs, acc);
        return acc;
      }, {}),
      router,
      variables,
      locale
    };
  }

  componentDidMount() {
    window.addEventListener("scroll", this.handleScroll);
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



  render() {
    const {profile, t} = this.props;
    const {variables} = profile;
    const {scrolled} = this.state;
    return <div className="profile" onScroll={this.handleScroll}>
      <Navbar
        className={scrolled ? "background" : ""}
        title={scrolled ? variables.name : ""}
      />
      <CMSProfile {...this.props} />

      <Footer />
    </div>;
  }
}


Profile.need = [
  fetchData("profile", "/api/profile/?slug=<slug>&id=<id>&slug2=<slug2>&id2=<id2>&slug3=<slug3>&id3=<id3>&locale=<i18n.locale>"),
  fetchData("formatters", "/api/formatters")
];

Profile.childContextTypes = {
  formatters: PropTypes.object,
  locale: PropTypes.string,
  router: PropTypes.object,
  variables: PropTypes.object
};


export default hot(withNamespaces()(
  connect(state => ({
    formatters: state.data.formatters,
    locale: state.i18n.locale,
    profile: state.data.profile
  }))(Profile)
));