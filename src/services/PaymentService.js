const { stat } = require('fs');
const { CONFIG_MESSAGE_ERRORS } = require('../configs');


const createUrlPaymentVNPay = (data, ipAddr) => {
    return new Promise((resolve, reject) => {
        const { totalPrice, language, orderId } = data;
        try {
            let date = new Date();

            let createDate = dateFormat(date, 'yyyymmddHHmmss');

            let tmnCode = process.env.VNPAY_TMN_CODE;
            let secretKey = process.env.VNPAY_SECRET_KEY;
            let returnUrl = process.env.VNPAY_RETURN_URL_SUCCESS;
            let vnpUrl = process.env.VNPAY_RETURN_URL;
            let bankCode = data.bankCode || "NCB";

            let orderInfo = req.body.orderDescription;
            let orderType = req.body.orderType;
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
            vnp_Params['vnp_TxnRef'] = codeOrder;
            vnp_Params['vnp_OrderInfo'] = codeOrder;
            vnp_Params['vnp_OrderType'] = "other";
            vnp_Params['vnp_Amount'] = totalPrice * 100;
            vnp_Params['vnp_ReturnUrl'] = returnUrl;
            vnp_Params['vnp_IpAddr'] = ipAddr;
            vnp_Params['orderId'] = orderId;
            vnp_Params['vnp_CreateDate'] = createDate;
            if (bankCode !== null && bankCode !== '') {
                vnp_Params['vnp_BankCode'] = bankCode;
            }

            vnp_Params = sortObject(vnp_Params);

            let querystring = require('qs');
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let crypto = require("crypto");
            let hmac = crypto.createHmac("sha512", secretKey);
            let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
            vnp_Params['vnp_SecureHash'] = signed;
            vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

            resolve({
                status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
                message: "Success",
                statusMessage: "Success",
                data: vnpUrl,
                typeError: "",
            })
        } catch (e) {
            reject(e);
        }
    })
}

const getVNPayIpnPayment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {

            let secureHash = data["vnp_SecureHash"];
            
            let rspCode = data["vnp_ResponseCode"];
            const orderId = data["orderId"];

            delete data["vnp_SecureHash"];
            delete data["vnp_SecureHashType"];
        
            vnp_Params = sortObject(vnp_Params);

            let secretKey = process.env.VNPAY_SECRET_KEY;
            let querystring = require('qs');
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let crypto = require("crypto");
            let hmac = crypto.createHmac("sha512", secretKey);
            let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

            let paymentStatus = "0";
            let checkOrderId = true
            let checkAmount = true

            if(secureHash === signed) {
                if(checkOrderId) {
                    if(checkAmount){
                        if(paymentStatus === "0"){
                            if(rspCode === "00"){
                                const existingOrder = await Order.findById(id)
                                if(!existingOrder){
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
                                    data: saveOrder,
                                    typeError: "",
                                })
                            } else{
                                res.status(200).json({
                                    RspCode: "00",
                                    Message: "Failed",
                                })
                                resolve({
                                    status: CONFIG_MESSAGE_ERRORS.GET_SUCCESS.status,
                                    message: 'Payment failed',
                                    typeError: "",
                                    data: {
                                        RspCode: "00",},
                                    statusMessage: "Success",
                                })
                            }
                        } else{
                            resolve({
                                status: CONFIG_MESSAGE_ERRORS.GET_SUCCESS.status,
                                message: 'This order has been updated',
                                typeError: "",
                                data: {
                                    RspCode: "02",},
                                statusMessage: "Success",
                            })
                        }
                    } else{
                        resolve({
                            status: CONFIG_MESSAGE_ERRORS.GET_SUCCESS.status,
                            message: 'Invalid amount',
                            typeError: "",
                            data: {
                                RspCode: "04",},
                            statusMessage: "Success",
                        })
                    }
                }
                else{
                    resolve({
                        status: CONFIG_MESSAGE_ERRORS.GET_SUCCESS.status,
                        message: 'Order not found',
                        typeError: "",
                        data: {
                            RspCode: "01",},
                        statusMessage: "Success",
                    })
                }
            }
            else{
                resolve({
                    status: CONFIG_MESSAGE_ERRORS.GET_SUCCESS.status,
                    message: 'Checksum failed',
                    typeError: "",
                    data: {
                        RspCode: "97",},
                    statusMessage: "Success",
                })
            }

            resolve({
                status: CONFIG_MESSAGE_ERRORS.ACTION_SUCCESS.status,
                message: "Create Url success",
                statusMessage: "Success",
                data: vnpUrl,
                typeError: "",
            })
        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {
    createUrlPaymentVNPay,
    getVNPayIpnPayment
}
