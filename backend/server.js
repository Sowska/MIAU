'use strict';

require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

// TODO: connect to MongoDB before listening
// const connectDB = require('./src/config/db');
// connectDB().then(() => {
//   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
