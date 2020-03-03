import React, {Component} from "react";
import Helmet from "react-helmet";

export default class Permissions extends Component {

  render() {
    return (
      <div className="permissions">
        <Helmet title="Permissions" />

        <a href="http://" target="_blank" rel="noopener noreferrer"></a>

        <h1> Permissions </h1>

        <p>The observatory is published under a <a href="https://en.wikipedia.org/wiki/Wikipedia:Text_of_Creative_Commons_Attribution-ShareAlike_3.0_Unported_License" target="_blank" rel="noopener noreferrer">Creative Commons Attribution-Sharealike 3.0 Unported License</a>, so feel free to share the site and embed the apps anywhere on the internet. When doing so, please remember to attribute the site and its <a href="/en/resources/about/" target="_blank" rel="noopener noreferrer">creators</a>.</p>

        <p>When refering to the site in publications please use the following citation: </p>

        <p className="citation">AJG Simoes, CA Hidalgo. The Economic Complexity Observatory: An Analytical Tool for Understanding the Dynamics of Economic Development. Workshops at the Twenty-Fifth AAAI Conference on Artificial Intelligence. (2011) </p>

        <p>For more information, please contact <a href="mailto:oec@media.mit.edu" target="_blank" rel="noopener noreferrer">oec@media.mit.edu</a>.</p>

        <h2>Re-using and Contributing</h2>

        <p>The Observatory website is an open source platform built as part of the lead developer, Alexander Simoes&apos; Master&apos;s Thesis at the MIT Media Lab. In being an open source project and leveraging the many technologies also available for fair use we welcome any and all collaborators to the project. Feel free to fork the site at: <a href="https://github.com/alexandersimoes/oec" target="_blank" rel="noopener noreferrer">github.com/alexandersimoes/atlas_economic_complexity</a></p>

        <p>We also provide an <a href="/en/resources/api" target="_blank" rel="noopener noreferrer">API</a> for the casual user interested in embedding their own Observatory app on any webpage.</p>

        <p>If you would like more info on the OEC or to create a similar site for your country, state, or city, get in touch with us at <a href="mailto:oec@media.mit.edu" target="_blank" rel="noopener noreferrer">oec@media.mit.edu</a>.</p>

      </div>
    );
  }
}
