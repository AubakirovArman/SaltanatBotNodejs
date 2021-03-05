let http1 = require('request')

class telegram {
    constructor() {
      this.token = ""
      this.id = ""
      this.url = ""
      this.text = ""
      this.answerMarket = ""
      this.status = "выкл"
      this.params = {
        'method': 'post',
        'muteHttpExceptions': true
      }
    }
    // отправка сообщение в телеграмм
    telegramSendLog() {
      if (this.status == "вкл") {
        this.answerMarket=JSON.stringify(this.answerMarket)
        this.answerMarket = this.answerMarket.replace("{", "");
        this.answerMarket = this.answerMarket.replace("}", "");
        let text = "Команда от tradingview:\n" + this.text + "\n" + "\n Oтвет биржы:\n (" + this.answerMarket + ")";
  
        this.message = this.url + "/sendMessage?chat_id=" + this.id + "&text=" + text;
        http1.post(this.message)

      }
    }
    telegramSendText() {
      if (this.status == "вкл") {
  
        this.text=encodeURIComponent(this.text)
        this.message = (this.url + "/sendMessage?chat_id=" + this.id + "&text=" + this.text);
        http1.post(this.message)
      }
    }
    telegramSend() {
      if (this.status == "вкл") {
        this.message = this.url + "/sendMessage?chat_id=" + this.id + "&text=" + this.text;
        http1.post(this.message)
      }
    }
  }





module.exports=telegram;