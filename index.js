const express = require('express');
const path = require('path');
const editRoutes = require("./routes/home")

const app = express();

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Set views folder (default is "./views")
app.set('views', path.join(__dirname, 'views'));

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', editRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
