const io = require("socket.io")();
const userModel = require('./models/user.js')
const messageModel = require('./models/message.schema.js')
const socketapi = {
    io: io
};



// Add your socket.io logic here!
io.on("connection", function (socket) {
    console.log("kuch bhi")

    socket.on('join', async username => {
        const data = await userModel.findOneAndUpdate({
            username
        }, {
            socketId: socket.id
        })
    })

    socket.on('sony', async messageObject => {

        const receiver = await userModel.findOne({
            fullname: messageObject.receiver
        })


        console.log(receiver);
        const socketId = receiver.socketId

        await messageModel.create({
            sender: messageObject.sender,
            receiver: messageObject.receiver,
            text: messageObject.message
        })

        socket.to(socketId).emit('max', messageObject)

    })

    socket.on('openChat', async userObject => {
        const { sender, receiver } = userObject
        const messages = await messageModel.find({
            $or: [
                {
                    sender: sender,
                    receiver: receiver
                },
                {
                    sender: receiver,
                    receiver: sender
                }
            ]
        })

        socket.emit('openChat', messages)

    })



});
// end of socket.io logic

/* 
socket - single user/browser
io- server
emit - send
on - receive
 */

module.exports = socketapi;