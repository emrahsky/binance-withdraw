const axios = require('axios');
const crypto = require("crypto");

const API_KEY = "xxxxx"
const API_SECRET = "xxxxxxx"
const API_URL = "https://api.binance.com"

const apiConnect = async (method, suffix, paramsObj) => {
    let resultData = responseMessage(false, null);
    const paramsToQuery = Object.keys(paramsObj).map(key => `${key}=${paramsObj[key]}`).join('&');
    const sign = crypto
        .createHmac('sha256', API_SECRET)
        .update(paramsToQuery)
        .digest('hex');

    const configs = {
        headers: {
            "Content-type": "application/json",
            "X-MBX-APIKEY": API_KEY
        }
    };

    paramsObj.signature = sign;
    const qs = Object.keys(paramsObj).map(key => `${key}=${paramsObj[key]}`).join('&');
    if (method == "POST") {
        await axios.post(API_URL + suffix + "?" + qs, {}, configs)
            .then((res) => {
                if (res) {
                    resultData = responseMessage(true, res.data);
                }
            }).catch((err) => {
                resultData = responseMessage(false, err.response.data);
            });
    } else if (method == "GET") {
        await axios.get(API_URL + suffix + "?" + qs.toString(), configs)
            .then((res) => {
                if (res) {
                    resultData = responseMessage(true, res.data);
                }
            }).catch((err) => {
                resultData = responseMessage(false, err.response.data);
            });
    }
    return resultData;
}

const responseMessage = (success, result) => {
    return {
        success: success,
        result: result
    }
}

const getUserAsset = async (asset) => {
    try {
        const requestData = {
            asset: asset,
            timestamp: Date.now()
        }
        const getData = await apiConnect("POST", "/sapi/v3/asset/getUserAsset", requestData);
        if (getData.success == true) {
            return responseMessage(true, Number(getData.result[0].free));
        } else {
            return responseMessage(false, getData.result);
        }
    } catch (e) {
        return responseMessage(false, e.message);
    }
}

const getFee = async (asset, network) => {
    try {
        const requestData = {
            timestamp: Date.now()
        }
        const getData = await apiConnect("GET", "/sapi/v1/capital/config/getall", requestData);
        if (getData.success == true) {
            for (let net of getData) {
                if (net.coin == asset) {
                    const netDetail = net.networkList.find(x => x.network == network);
                    return responseMessage(true, Number(netDetail.withdrawFee));
                }
            }
            return responseMessage(false, null);
        } else {
            return responseMessage(false, getData.result);
        }
    } catch (e) {
        return responseMessage(false, e.message);
    }
}

const withdraw = async (asset, network, toAddress, amount) => {
    try {
        const balance = await getUserAsset(asset);
        if (balance.success == false)  return responseMessage(false, balance.result);
        // const fee = await getFee(asset, network);
        // if (fee.success == true)  return responseMessage(false, fee.result);

        if (amount > balance) return responseMessage(false, "Not enough balance!");

        const requestData = {
            coin: asset,
            network: network,
            address: toAddress,
            amount: amount,
            timestamp: Date.now()
        }
        const withdraw = await apiConnect("POST", "/sapi/v1/capital/withdraw/apply", requestData);
        if(withdraw.success == true) return responseMessage(true, withdraw);
        else return responseMessage(false, withdraw.result);
        
    } catch (e) {
        return responseMessage(false, e.message);
    }
}

const main = async () => {
    console.log(await withdraw("BNB", "BSC", "0x000000000", "0.1"));
}

main();