var connect = require('connect');
var serveStatic = require('serve-static');

var app = connect();

app.use('/', serveStatic(__dirname + '/public', {'index': ['index.html']}));
app.use('/ui', serveStatic(__dirname + '/public/views', {'index': ['ui.html']}));
app.listen(8000);
