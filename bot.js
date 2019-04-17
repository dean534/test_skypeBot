const {
    ActivityTypes,
    ActionTypes,
    CardFactory,
    MessageFactory,
    TurnContext
} = require('botbuilder');

const { ConversationReference } = require('./helper/Schema')
// const {
//     QnAMaker
// } = require('botbuilder-ai');

const {
    Announce
} = require('./helper/announce');

const CHANNEL_LIST = 'channelList';

class Bot {
    constructor(botState, adapter, endpoint, qnaOptions) {
        // 這裡是儲存state的地方，目前暫時沒有用到
        this.channelList = botState.createProperty(CHANNEL_LIST);
        this.botState = botState;
        // this.qnaMaker = new QnAMaker(endpoint, qnaOptions);
        this.adapter = adapter;
    }

    // 用於提取檔案
    getInternetAttachment(name, contentType, contentUrl) {
        return {
            name,
            contentType,
            contentUrl
        };
    }

    async onTurn(turnContext) {
        if (turnContext.activity.type === ActivityTypes.Message) {
            let message = (turnContext.activity.text).trim().toLowerCase().split(' ')
            console.log(message)
            let reply;
            switch (message[1]) {
                case 'checkchannel':
                    await this.checkChannel(turnContext)
                    break;
                case 'setchannel':
                    await this.setChannel(turnContext, message);
                    break;
                case 'announce':
                    await this.announce(turnContext, message);
                    break;
                case '維護時間':
                    let res = await Announce.get(`/next`);
                    reply = `${res.data.title} 
                    ${ res.data.detail}`
                    await turnContext.sendActivity(reply);
                    break;
                case '登入流程':
                    const loginTypes = ['普通登入', 'Token登入', 'appLink登入']
                    const btns = loginTypes.map(loginType => ({
                        type: ActionTypes.ImBack,
                        title: loginType,
                        value: loginType
                    }))
                    const card = CardFactory.heroCard('', undefined, btns, {
                        text: '請問您要詢問那一種登入方式？'
                    });
                    reply = {
                        type: ActivityTypes.Message
                    };
                    reply.attachments = [card];
                    await turnContext.sendActivity(reply);
                    break;
                case '普通登入':
                    reply = {
                        type: ActivityTypes.Message
                    };
                    reply.attachments = [this.getInternetAttachment('普通登入的流程', 'image/png', 'https://ancient-journey-32544.herokuapp.com/image/normal.png')];
                    reply.text = '這是普通登入的流程';
                    await turnContext.sendActivity(reply);
                    break;
                case 'token登入':
                    reply = {
                        type: ActivityTypes.Message
                    };
                    reply.attachments = [this.getInternetAttachment('Token 登入的流程', 'image/png', 'https://ancient-journey-32544.herokuapp.com/image/token.png')];
                    reply.text = '這是Token 登入的流程';
                    await turnContext.sendActivity(reply);
                    break;
                case 'applink登入':
                    reply = {
                        type: ActivityTypes.Message
                    };
                    reply.attachments = [this.getInternetAttachment('appLink 登入的流程', 'image/png', 'https://ancient-journey-32544.herokuapp.com/image/applinks.png')];
                    reply.text = '這是appLink 登入的流程';
                    await turnContext.sendActivity(reply);
                    break;
                case 'help':
                    // 叫出工具列
                    await this.callhelp(turnContext);
                    break;
                default:
                    // qna到期，取消服務
                    // const qnaResults = await this.qnaMaker.getAnswers(turnContext);
                    // // 如果qna有回傳答案，就回傳
                    // if (qnaResults[0]) {
                    //     await turnContext.sendActivity(qnaResults[0].answer);
                    // } else {
                    //     await turnContext.sendActivity(`您好,目前暫時無法幫您解答,我們將在明日為您服務`);
                    // }
                    await turnContext.sendActivity(`您好,目前暫時無法幫您解答,我們將在明日為您服務`);
            }
        } else {
            // 若不是傳訊事件，就回傳
            await turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
        }
        // 儲存state
        await this.botState.saveChanges(turnContext);
    }
    async callhelp(turnContext) {
        const helpList = ['維護時間', '登入流程']
        // help內的字句
        const btns = helpList.map(help => ({
            type: ActionTypes.ImBack,
            title: help,
            value: help
        }))
        const card = CardFactory.heroCard('', undefined, btns, {
            text: `請問您有什麼疑問？
            關於`
        });
        const reply = {
            type: ActivityTypes.Message
        };
        reply.attachments = [card];
        await turnContext.sendActivity(reply);
        await turnContext.sendActivity('或是輸入你的問題');
    }
    async setChannel(turnContext, message) {
        const reference = TurnContext.getConversationReference(turnContext.activity);
        const channels = await this.channelList.get(turnContext, {});
        channels[message[2]] = {
            name: message[2],
            conversation: reference.conversation,
        }
        console.log(channels[message[2]].conversation);
        try {
            await this.channelList.set(turnContext, channels);
            await turnContext.sendActivity('Successful to add channel.');
        } catch (err) {
            await turnContext.sendActivity(`Write failed: ${err.message}`);
        }
    }
    async checkChannel(turnContext) {
        const channels = await this.channelList.get(turnContext, {});
        if (Object.keys(channels).length) {
            await turnContext.sendActivity(
                '| Channel Name &nbsp; | Conversation ID &nbsp; |<br>' +
                '| :--- | :---: |<br>' +
                Object.keys(channels).map((key) => {
                    return `${key} &nbsp; | ${channels[key].conversation.id.split('|')[0]}`;
                }).join('<br>'));
        } else {
            await turnContext.sendActivity('The channels log is empty.');
        }
    }

    async announce(turnContext, message) {
        if (message[2]) {
            // fetch channel list
            const channels = await this.channelList.get(turnContext, {});
            const { bot, channelId, conversation, serviceUrl } = TurnContext.getConversationReference(turnContext.activity);
            let ref = new ConversationReference(null, bot, channelId, conversation, null, serviceUrl)
            try {
                // fetch announce
                for (let channel in channels) {
                    ref.conversation = channels[channel].conversation;
                    await this.adapter.continueConversation(ref, async (proactiveTurnContext) => {
                        if (message[2]==='satisfy'){
                            var reply = MessageFactory.suggestedActions(['Red', 'Yellow', 'Blue'], 'What is the best color?');
                            await turnContext.sendActivity(reply);
                            // const suggest =['非常不滿意','不滿意','普通','滿意','非常滿意']
                            // let reply = MessageFactory.suggestedActions(suggest, '您對我們的服務感到');
                            // await proactiveTurnContext.sendActivity(reply);
                        }else{
                            let res = await Announce.get(`/${message[2]}`);
                            let reply = `${ res.data.title} 
                            ${ res.data.detail }`
                            await proactiveTurnContext.sendActivity(reply);
                        }
                    });
                }
                await turnContext.sendActivity(`Announce has been send`)
            } catch (err) {
                await turnContext.sendActivity(`err: ${err}`)
            }
        } else {
            await turnContext.sendActivity(`請輸入欲廣播的項目`)
        }
    }
}


exports.Bot = Bot;