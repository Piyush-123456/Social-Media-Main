const io = require("socket.io")();
const UserCollection = require("./models/user");
const socketapi = {
    io: io
};

// Add your socket.io logic here!
io.on("connection", function (socket) {
    console.log("A user connected");
    //1. We have inserted the updated socket Id into the User Schema
    socket.on("join", async username => {
        const user = await UserCollection.findOneAndUpdate({
            username
        }, {
            socketId: socket.id
        })
    })

    
});
// end of socket.io logic

module.exports = socketapi;