import db_logger
# ... inside execute_order ...
    result = mt5.order_send(request)
    if result.retcode == mt5.TRADE_RETCODE_DONE:
        db_logger.log_event('ORDER_SENT', symbol, 'Success', ticket=result.order)
        threading.Thread(target=monitor_order, args=(result.order,)).start()
    else:
        db_logger.log_event('ORDER_FAILED', symbol, result.comment)
