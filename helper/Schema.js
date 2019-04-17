let Schema = {};

Schema.ConversationReference = function (activityId, bot, channelId, conversation, user, serviceUrl) {
    this.activityId = activityId;
    this.bot = bot;
    this.channelId = channelId;
    this.conversation = conversation;
    this.user = user;
    this.serviceUrl = serviceUrl;
}

module.exports = Schema;