module.exports = (app) => {
    app.get("/debug", (req, res) => {
        res.send("works!");
    });
};
