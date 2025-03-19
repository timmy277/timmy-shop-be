const { CONFIG_MESSAGE_ERRORS, PAYMENT_TYPES } = require("../configs");
const { validateRequiredInput } = require("../utils");
const PaymentService = require("../services/PaymentService");

const createUrlPaymentVNPay = async (req, res) => {
  try {
    const requiredFields = validateRequiredInput(req.body, ["totalPrice", "language", "orderId"]);

    let ipAddr = req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress ||
      req.socket.remoteAddress;

    if (requiredFields?.length) {
      return res.status(CONFIG_MESSAGE_ERRORS.INVALID.status).json({
        status: "Error",
        typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
        message: `The field ${requiredFields.join(", ")} is required`,
        data: null,
      });
    }

    const response = await PaymentService.createUrlPaymentVNPay(req.body, ipAddr);
    const { data, status, typeError, message, statusMessage } = response;
    return res.status(status).json({
      typeError,
      data,
      message,
      status: statusMessage,
    });
  } catch (e) {
    console.log("payment",e);
    return res.status(CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status).json({
      message: "Internal Server Error",
      data: null,
      status: "Error",
      typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
    })
  }
};

const getVNPayIpnPayment = async (req, res) => {
  try {
    let vnp_params = req.query
    const requiredFields = validateRequiredInput(vnp_params, ["vnp_SecureHash", "vnp_TxnRef", "vnp_ResponseCode", "orderId"]);

    let ipAddr = req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress ||
      req.socket.remoteAddress;

    if (requiredFields?.length) {
      return res.status(CONFIG_MESSAGE_ERRORS.INVALID.status).json({
        status: "Error",
        typeError: CONFIG_MESSAGE_ERRORS.INVALID.type,
        message: `The field ${requiredFields.join(", ")} is required`,
        data: null,
      });
    }

    const response = await PaymentService.getVNPayIpnPayment(req.body, ipAddr);
    const { data, status, typeError, message, statusMessage } = response;
    return res.status(status).json({
      typeError,
      data,
      message,
      status: statusMessage,
    });
  } catch (e) {
    return res.status(CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.status).json({
      message: "Internal Server Error",
      data: null,
      status: "Error",
      typeError: CONFIG_MESSAGE_ERRORS.INTERNAL_ERROR.type,
    })
  }
};




module.exports = {
  createUrlPaymentVNPay,
  getVNPayIpnPayment
};
