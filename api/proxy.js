const axios = require("axios"),
      jwt = require("jsonwebtoken"),
      url = require("url");

const {
  OLAP_PROXY_ENDPOINT,
  OLAP_PROXY_SECRET
} = process.env;

module.exports = function(app) {

  app.get("/olap-proxy/*", async(req, res) => {

    const params = req.params[0];
    const baseURL = url.resolve(OLAP_PROXY_ENDPOINT, params);
    const queryString = url.parse(req.url).query;
    const fullURL = queryString ? `${baseURL}?${queryString}` : baseURL;
    const {user} = req;

    let apiToken = req.headers["x-tesseract-jwt-token"];
    if (!apiToken) {
      apiToken = jwt.sign(
        {
          role: user ? user.role : 0,
          sub: user ? user.id : "localhost",
          status: "valid"
        },
        OLAP_PROXY_SECRET,
        {expiresIn: "30m"}
      );
    }

    const config = {
      headers: {
        "x-tesseract-jwt-token": apiToken
      }
    };

    const data = await axios.get(fullURL, config)
      .then(resp => resp.data)
      .catch(error => {
        const {response} = error;
        const errorObject = Object.assign({}, response, {request: undefined});
        res.status(response.status);
        return errorObject;
      });

    res.send(data).end();

  });

};
