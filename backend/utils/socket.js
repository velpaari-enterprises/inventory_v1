const { getIO } = require("../socket");

const emitEvent = (event, payload) => {
  try {
    const io = getIO();
    io.emit(event, payload);
  } catch (error) {
    // Socket server not initialized yet; ignore.
  }
};

module.exports = { emitEvent };
