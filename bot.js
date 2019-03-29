const {
    ActivityTypes,
    ActionTypes,
    CardFactory
} = require('botbuilder');
const {
    QnAMaker
} = require('botbuilder-ai');
const axios = require('axios');
const storageUrl = 'https://ancient-journey-32544.herokuapp.com';
// "http://localhost:3000"

// Turn counter property
const TURN_STATE_PROPERTY = 'turnStateProperty';

class Bot {
    /**  
     * @param {ConversationState} conversation state object
     */
    constructor(conversationState, endpoint, qnaOptions) {
        // Creates a new state accessor property.
        // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors
        this.stateProperty = conversationState.createProperty(TURN_STATE_PROPERTY);
        this.conversationState = conversationState;
        this.qnaMaker = new QnAMaker(endpoint, qnaOptions);
    }

    getInternetAttachment(name, fileType, contentUrl) {
        let contentType;
        if (fileType === 'jpg') {
            contentType = `image/${ fileType }`;
        } else {
            contentType = `application/${ fileType }`;
        }
        return {
            name,
            contentType,
            contentUrl
        };
    }

    async onTurn(turnContext) {
        if (turnContext.activity.type === ActivityTypes.Message) {
            // read from state.
            let reply;
            switch (turnContext.activity.text) {

                case '維護時間':
                    let bulletin = await axios.get(`${ storageUrl }/api/bulletin`);
                    await turnContext.sendActivity();
                    await turnContext.sendActivity(`
                ${ bulletin.data.title } 
                ${ bulletin.data.detail }
                `);
                    break;
                case 'api 文件':
                    reply = {
                        type: ActivityTypes.Message
                    };
                    reply.attachments = [this.getInternetAttachment('api document', 'pdf', `${ storageUrl }/pdf/testPDF.pdf`)];
                    reply.text = '這是最新的api文件';
                    // Send the activity to the user.
                    await turnContext.sendActivity(reply);
                    break;
                case '登入流程':
                    const buttons = [{
                            type: ActionTypes.ImBack,
                            title: '普通登入',
                            value: '普通登入'
                        },
                        {
                            type: ActionTypes.ImBack,
                            title: 'Token 登入',
                            value: 'Token 登入'
                        },
                        {
                            type: ActionTypes.ImBack,
                            title: 'appLink 登入',
                            value: 'appLink 登入'
                        }
                    ];
                    // construct hero card.
                    const card = CardFactory.heroCard('', undefined, buttons, {
                        text: `
                請問您要詢問那一種登入方式？
                `
                    });
                    // add card to Activity.
                    reply = {
                        type: ActivityTypes.Message
                    };
                    reply.attachments = [card];
                    // Send hero card to the user.
                    await turnContext.sendActivity(reply);
                    break;
                case '普通登入':
                    reply = {
                        type: ActivityTypes.Message
                    };
                    reply.attachments = [this.getInternetAttachment('普通登入的流程', 'jpg', 'http://ithelp.ithome.com.tw/upload/images/20141004/2014100423582554301921ad15f_resize_600.png')];
                    reply.text = '這是普通登入的流程';
                    // Send the activity to the user.
                    await turnContext.sendActivity(reply);
                    break;
                case 'Token 登入':
                    reply = {
                        type: ActivityTypes.Message
                    };
                    reply.attachments = [this.getInternetAttachment('Token 登入的流程', 'jpg', 'https://img.akanelee.me/20150515-1.jpg')];
                    reply.text = '這是Token 登入的流程';
                    // Send the activity to the user.
                    await turnContext.sendActivity(reply);
                    break;
                case 'appLink 登入':
                    reply = {
                        type: ActivityTypes.Message
                    };
                    reply.attachments = [this.getInternetAttachment('appLink 登入的流程', 'jpg', 'data:image/png;base64,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')];
                    reply.text = '這是appLink 登入的流程';
                    // Send the activity to the user.
                    await turnContext.sendActivity(reply);
                    break;
                case 'help':
                    // Send greeting when users are added to the conversation.
                    await this.sendRoot(turnContext);
                    break;
                default:
                    const qnaResults = await this.qnaMaker.getAnswers(turnContext);
                    // If an answer was received from QnA Maker, send the answer back to the user.
                    if (qnaResults[0]) {
                        await turnContext.sendActivity(qnaResults[0].answer);
                        // If no answers were returned from QnA Maker, reply with help.
                    } else {
                        await turnContext.sendActivity(`您好,目前暫時無法幫您解答,我們將在明日為您服務`);
                    }
            }
        } else {
            // Generic handler for all other activity types.
            await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
        // Save state changes
        await this.conversationState.saveChanges(turnContext);
    }
    async sendRoot(turnContext) {
        // 在這裡加入歡迎的字句
        const buttons = [{
                type: ActionTypes.ImBack,
                title: '維護時間',
                value: '維護時間'
            },
            {
                type: ActionTypes.ImBack,
                title: 'api 文件',
                value: 'api 文件'
            },
            {
                type: ActionTypes.ImBack,
                title: '登入流程',
                value: '登入流程'
            }
        ];
        // construct hero card.
        const card = CardFactory.heroCard('', undefined, buttons, {
            text: `
                    請問您有什麼疑問？
                    關於
                    `
        });
        // add card to Activity.
        const reply = {
            type: ActivityTypes.Message
        };
        reply.attachments = [card];
        // Send hero card to the user.
        await turnContext.sendActivity(reply);
        await turnContext.sendActivity('或是輸入你的問題');
    }
}

exports.Bot = Bot;