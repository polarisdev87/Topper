var connect = require('connect');
var serveStatic = require('serve-static');

var app = connect();

app.use(serveStatic(__dirname + '/public', {'index': ['index.html']}));
app.listen(3000);