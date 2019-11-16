module.exports = [{
    'event': 'messageCreate',
    'disabled': true,
    'execute': async function(ctx, msg) {
        if (!ctx._chans || !ctx._chans[msg.channel.id]) {
            var c = await ctx.sql._db.models.k_chans.findOne({
                where: {
                    chan_id: msg.channel.id
                }
            });
            if (!ctx._chans) ctx._chans = {};
            ctx._chans[msg.channel.id] = c ? c.dataValues.enabled : false;
        }
        console.log(ctx._chans);
        if (!ctx._chans || !ctx._chans[msg.channel.id]) return;
        if (!ctx._net) ctx._net = {};
        if (!ctx._net.brain) ctx._net.brain = new ctx.util.brain.recurrent.LSTM();
        if (!ctx._net.train) ctx._net.train = new ctx.util.brain.TrainStream({
            neuralNetwork: ctx._net.brain,
            floodCallback: () => { trainCallback(ctx._net.train); },
            doneTrainingCallback: (obj) => { console.log(obj); }
        });

        function trainCallback(stream) {
            console.log('training.');
            stream.write(msg.content);
            stream.endInputs();
        }
        trainCallback(ctx._net.train);
        if (!msg.content.startsWith("knuckles")) return;
        var out = ctx._net.brain.run(msg.content);
        if (out.length <= 1900) {
            msg.channel.createMessage(out);
        }
        else {
            msg.channel.createMessage("response length too great");
        }
    }
}]