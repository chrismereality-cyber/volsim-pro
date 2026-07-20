def execute_order(cmd):
    global last_tick_time
    
    # RISK GATE: Check if data is stale
    if (time.time() - last_tick_time) > MAX_LATENCY_SECONDS:
        print('REJECTED: Stale data detected')
        return None

    symbol = cmd.get('symbol')
    action = cmd.get('action')
    volume = float(cmd.get('volume', 0.1))
    
    tick = mt5.symbol_info_tick(symbol)
    price = tick.ask if action == 'buy' else tick.bid
    
    # Calculate SL/TP (Example: 500 points offset)
    point = mt5.symbol_info(symbol).point
    sl = price - (500 * point) if action == 'buy' else price + (500 * point)
    tp = price + (1000 * point) if action == 'buy' else price - (1000 * point)
    
    request = {
        'action': mt5.TRADE_ACTION_DEAL,
        'symbol': symbol,
        'volume': volume,
        'type': mt5.ORDER_TYPE_BUY if action == 'buy' else mt5.ORDER_TYPE_SELL,
        'price': price,
        'sl': sl,
        'tp': tp,
        'deviation': 20,
        'magic': 123456,
        'comment': 'volsim-pro protected',
        'type_time': mt5.ORDER_TIME_GTC,
        'type_filling': mt5.ORDER_FILLING_IOC,
    }
    
    result = mt5.order_send(request)
    print(f'Order result: {result}')
    return result
