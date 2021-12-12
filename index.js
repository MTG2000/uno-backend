const { server } = require("./server");
require("./real-time");

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`listening on port :${PORT}`);
});
