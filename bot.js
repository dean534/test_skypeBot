const {
    ActivityTypes,
    ActionTypes,
    CardFactory,
    TurnContext
} = require('botbuilder');
// const {
//     QnAMaker
// } = require('botbuilder-ai');

const {
    Announce
} = require('./helper/announce');

const TURN_STATE_PROPERTY = 'turnStateProperty';
const CHANNEL_LIST = 'channelList';

class Bot {
    constructor(botState, adapter, endpoint, qnaOptions) {
        // 這裡是儲存state的地方，目前暫時沒有用到
        this.stateProperty = botState.createProperty(TURN_STATE_PROPERTY);
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
                case 'checkchannelstate':
                    await this.checkState(turnContext)
                    break;
                case 'announce':
                    await this.announce(turnContext, message);
                    break;
                case '維護時間':
                    let res = await Announce.get(`/next`);
                    await turnContext.sendActivity(`
                        ${ res.data.title } 
                        ${ res.data.detail }
                    `);
                    break;
                case '登入流程':
                    const buttons = [{
                            type: ActionTypes.ImBack,
                            title: '普通登入',
                            value: '普通登入'
                        },
                        {
                            type: ActionTypes.ImBack,
                            title: 'Token登入',
                            value: 'Token登入'
                        },
                        {
                            type: ActionTypes.ImBack,
                            title: 'appLink登入',
                            value: 'appLink登入'
                        }
                    ];
                    const card = CardFactory.heroCard('', undefined, buttons, {
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
            await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
        // 儲存state
        await this.botState.saveChanges(turnContext);
    }
    async callhelp(turnContext) {
        // help內的字句
        const buttons = [{
                type: ActionTypes.ImBack,
                title: '維護時間',
                value: '維護時間'
            },
            {
                type: ActionTypes.ImBack,
                title: '登入流程',
                value: '登入流程'
            }
        ];
        const card = CardFactory.heroCard('', undefined, buttons, {
            text: `
                    請問您有什麼疑問？
                    關於
                    `
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
            reference: {
                bot: reference.bot,
                channelId: reference.channelId,
                conversation: reference.conversation,
                serviceUrl: reference.serviceUrl
            }
        }
        try {
            await this.channelList.set(turnContext, channels);
            await turnContext.sendActivity('Successful write to log.');
        } catch (err) {
            await turnContext.sendActivity(`Write failed: ${ err.message }`);
        }
    }
    async checkState(turnContext) {
        const channels = await this.channelList.get(turnContext, {});
        await turnContext.sendActivity(`${ JSON.stringify(channels) }`);
    }
    async checkChannel(turnContext) {
        const channels = await this.channelList.get(turnContext, {});
        if (Object.keys(channels).length) {
            await turnContext.sendActivity(
                '| Channel Name &nbsp; | Conversation ID &nbsp; |<br>' +
                '| :--- | :---: |<br>' +
                Object.keys(channels).map((key) => {
                    return `${ key } &nbsp; | ${ channels[key].reference.conversation.id.split('|')[0] }`;
                }).join('<br>'));
        } else {
            await turnContext.sendActivity('The channels log is empty.');
        }
    }

    async announce(turnContext, message) {
        if (message[2]) {
            const channels = await this.channelList.get(turnContext, {});
            let res = await Announce.get(`/${message[2]}`);
            if (res.status==200){
                try {
                    for (let channel in channels) {
                        let reference = channels[channel].reference;
                        await this.adapter.continueConversation(reference, async (proactiveTurnContext) => {
                            await proactiveTurnContext.sendActivity(`
                            ${ res.data.title } 
                            ${ res.data.detail }
                            `);
                        });
                    }
                    await turnContext.sendActivity(`Announce has been send`)
                } catch (err) {
                    await turnContext.sendActivity(`err happened.`)
                }
            } else {
                await turnContext.sendActivity(`請確認輸入的是有效的 announce id。`)
            }

        } else {
            await turnContext.sendActivity(`請輸入欲廣播的項目id`)
        }
    }
}


exports.Bot = Bot;