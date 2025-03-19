const { stat } = require('fs');
const { CONFIG_MESSAGE_ERRORS } = require('../configs');
const moment = require('moment');


const createUrlPaymentVNPay = (data, ipAddr) => {
    return new Promise((resolve, reject) => {
        const { totalPrice, language, orderId } = data;
        try {
            let date = new Date();

            let createDate = moment(date).format('YYYYMMDDHHmmss');

            let tmnCode = process.env.VNPAY_TMN_CODE;
            let secretKey = process.env.VNPAY_SECRET_KEY;
            let returnUrl = process.env.VNPAY_RETURN_URL_SUCCESS;
            let vnpUrl = process.env.VNPAY_RETURN_URL;
            let bankCode = data.bankCode || "NCB";

            // let orderInfo = req.body.orderDescription;
            // let orderType = req.body.orderType;
            let locale = language;
            if (locale === null || locale === '') {
                locale = 'vn';
            }

            let codeOrder = moment(date).format("DDHHmmss")

            let currCode = 'VND';
            let vnp_Params = {};
            vnp_Params['vnp_Version'] = '2.1.0';
            vnp_Params['vnp_Command'] = 'pay';
            vnp_Params['vnp_TmnCode'] = tmnCode;
            // vnp_Params['vnp_Merchant'] = ''
            vnp_Params['vnp_Locale'] = locale;
            vnp_Params['vnp_CurrCode'] = currCode;
            vnp_Params['vnp_TxnRef'] = orderId;
            vnp_Params['vnp_OrderInfo'] = "Thanh toán cho mã giao dịch" + codeOrder;
            vnp_Params['vnp_OrderType'] = "other";
            vnp_Params['vnp_Amount'] = totalPrice * 100;
            vnp_Params['vnp_ReturnUrl'] = returnUrl;
            vnp_Params['vnp_IpAddr'] = ipAddr;
            vnp_Params['vnp_CreateDate'] = createDate;
            if (bankCode !== null && bankCode !== '') {
                vnp_Params['vnp_BankCode'] = bankCode;
            }

            vnp_Params = sortObject(vnp_Params);

            let querystring = require('qs');
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let crypto = require("crypto");
            let hmac = crypto.createHmac("sha512", secretKey);
            let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
            vnp_Params['vnp_SecureHash'] = signed;
            vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false })

            resolve({
                status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
                message: "Success",
                statusMessage: "Success",
                data: vnpUrl,
                typeError: "",
            })
        } catch (e) {
            console.log("pay ser", e);
            reject(e);
        }
    })
}

const getVNPayIpnPayment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {

            let secureHash = data["vnp_SecureHash"];

            const { orderId, ...rests } = data

            let rspCode = data["vnp_ResponseCode"];

            delete data["vnp_SecureHash"];
            delete data["vnp_SecureHashType"];

            let vnp_Params = { ...rests }

            vnp_Params = sortObject(vnp_Params);

            let secretKey = process.env.VNPAY_SECRET_KEY;

            let querystring = require('qs');
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let crypto = require("crypto");
            let hmac = crypto.createHmac("sha512", secretKey);
            let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

            let paymentStatus = "0";
            let checkOrderId = true
            let checkAmount = true

            if (secureHash === signed) {
                let orderId = vnp_Params["vnp_TxnRef"];
                let rspCode = vnp_Params["vnp_ResponseCode"];
                const existingOrder = await Order.findById(orderId)
                if (!existingOrder) {
                    reject({
                        status: CONFIG_MESSAGE_ERRORS.INVALID.status,
                        message: `Order with ID ${id} not found`,
                        typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
                        data: null,
                        statusMessage: "Error",
                    })
                    return
                }
                const currentTime = moment()
                const formattedTime = currentTime.format('YYYY-MM-DD HH:mm:ss')
                existingOrder.isPaid = 1
                existingOrder.paidAt = formattedTime
                existingOrder.status = 1

                const saveOrder = await existingOrder.save()
                resolve({
                    status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
                    message: "Payment success",
                    statusMessage: "Success",
                    data: {RspCode: "00", totalPrice: saveOrder.totalPrice},
                    typeError: "",
                })
            } else {
                resolve({
                    status: CONFIG_MESSAGE_ERRORS.GET_SUCCESS.status,
                    message: 'Payment failed',
                    typeError: "",
                    data: {
                        RspCode: "97",
                    },
                    statusMessage: "Success",
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

module.exports = {
    createUrlPaymentVNPay,
    getVNPayIpnPayment
}
