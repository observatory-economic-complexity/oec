import colors from "./helpers/colors";
import {mean} from "d3-array";

const bad = "#cf5555";
const good = "#3182bd";

/**
  The object exported by this file will be used as a base config for any
  d3plus-react visualization rendered on the page.
*/

const badMeasures = [];
export {badMeasures};

/**
 * Finds a color if defined in the color lookup.
 * @param {Object} d
 */
function findColor(d) {
  let detectedColors = [];
  if (this && this._filteredData) {
    detectedColors = Array.from(new Set(this._filteredData.map(findColor)));
  }
  if (detectedColors.length !== 1) {
    for (const key in colors) {
      if (`${key} ID` in d || key === "Continent") {
        return colors[key][d[`${key} ID`]] || colors[key][d[key]] || "transparent" || colors.colorGrey;
      }
    }
  }
  return Object.keys(d).some(v => badMeasures.includes(v)) ? bad : good;
}

/**
 * Finds a icon for legend.
 * @param {Object} d
 */
function backgroundImage(d) {

  if ("Chapter ID" in d) {
    return `/images/icons/hs/hs_${d["Chapter ID"]}.png`;
  }
  else if ("Continent" in d) {
    return `/images/icons/country/country_${d["Continent ID"]}.png`;
  }
  else if ("Flow" in d) {
    const options = {1: "export", 2: "import"};
    return `/images/icons/balance/${options[d["Flow ID"]]}_val.png`;
  }
  else {
    return undefined;
  }
}

const axisStyles = {
  barConfig: {
    stroke: "#FFFFFF"
  },
  gridConfig: {
    stroke: "#FFFFFF",
    strokeWidth: 1
  },
  labelConfig: {
    fontColor: () => "#FFFFFF",
    // fontFamily: () => "Source Sans Pro",
    fontSize: () => 12,
    fontWeight: () => 400
  },
  shapeConfig: {
    labelConfig: {
      fontColor: () => "#FFFFFF",
      // fontFamily: () => "Source Sans Pro",
      fontSize: () => 12,
      fontWeight: () => 400
    },
    stroke: "#FFFFFF"
  },
  tickSize: 5,
  titleConfig: {
    fontColor: () => "#FFFFFF",
    // fontFamily: () => "Palanquin",
    fontSize: () => 12,
    fontWeight: () => 400
  }
};

export default {
  aggs: {
    "Chapter ID": mean,
    "Flow ID": mean
  },
  backgroundConfig: {
    fill: "#383e44"
  },
  xConfig: axisStyles,
  yConfig: axisStyles,
  barPadding: 0,
  legendConfig: {
    label: "",
    shapeConfig: {
      height: () => 25,
      width: () => 25,
      backgroundImage: d => backgroundImage(d)
    }
  },
  layoutPadding: 1,
  legendTooltip: {
    title: d => {
      const title = d.Country;
      const bgColor = findColor(d);

      let tooltip = "<div class='d3plus-tooltip-title-wrapper'>";
      const imgUrl = backgroundImage(d);

      tooltip += `<div class="icon" style="background-color: ${bgColor}"><img src="${imgUrl}" /></div>`;
      tooltip += `<span>${d.Continent || d.Chapter || d.Flow}</span>`;
      tooltip += "</div>";
      return tooltip;
    }
  },
  tooltipConfig: {
    arrowStyle: {
      "background": "#66737e",
      "z-index": 18
    },
    title: d => {
      const dd = ["HS6", "HS4", "HS2", "Chapter", "Country", "Flow"].find(h => h in d);
      const bgColor = "Country" in d ? "transparent" : findColor(d);
      const options = {1: "export", 2: "import"};

      let tooltip = "<div class='d3plus-tooltip-title-wrapper'>";
      const imgUrl = "Country" in d ? `/images/icons/country/country_${d["ISO 3"]}.png`
        : "Chapter" in d ? `/images/icons/hs/hs_${d["Chapter ID"]}.png`
          : `/images/icons/balance/${options[d["Flow ID"]]}_val.png`;

      tooltip += `<div class="icon" style="background-color: ${bgColor}"><img src="${imgUrl}" /></div>`;
      tooltip += `<span>${d[dd]}</span>`;
      tooltip += "</div>";
      return tooltip;
    },
    background: "#282f37",
    border: "1px solid #66737e",
    footerStyle: {
      "color": "#666",
      "fontFamily": () => "'Source Sans Pro', sans-serif",
      "font-size": "12px",
      "font-weight": "300",
      "padding-top": "5px",
      "text-align": "center"
    },
    padding: "0px",
    titleStyle: {
      "color": "#FFFFFF",
      "padding": "5px",
      "fontFamily": () => "'Source Sans Pro', sans-serif",
      "font-size": "16px",
      "font-weight": "600",
      "max-height": "100px",
      "overflow": "hidden",
      "text-overflow": "ellipsis",
      "display": "-webkit-box",
      "-webkit-box-orient": "vertical",
      "-webkit-line-clamp": "3"
    },
    tbodyStyle: {
      color: "#FFFFFF"
    },
    width: "200px"
  },
  total: "Trade Value",
  totalConfig: {
    "fontColor": () => "#FFFFFF",
    "fontSize": () => 14,
    "text-transform": "uppercase"
  },
  titleConfig: {
    "fontColor": () => "#FFFFFF",
    "fontSize": () => 14,
    "text-transform": "uppercase"
  },
  shapeConfig: {
    Area: {
      strokeWidth: d => {
        const c = findColor(d);
        return [good, bad].includes(c) ? 1 : 0;
      }
    },
    Bar: {
      labelConfig: {
        fontSize: () => 13
      },
      strokeWidth: d => {
        const c = findColor(d);
        return [good, bad].includes(c) ? 1 : 0;
      }
    },
    fill: findColor,
    labelConfig: {
      fontSize: () => 13
    },
    Line: {
      curve: "monotoneX",
      stroke: d => findColor(d),
      strokeWidth: 3,
      strokeLinecap: "round"
    },
    Path: {
      fillOpacity: 0.75,
      strokeOpacity: 0.25
    },
    Rect: {
      labelConfig: {
        fontResize: true,
        fontFamily: () => "Fira Sans Condensed",
        padding: 10
      }
    }
  }
};