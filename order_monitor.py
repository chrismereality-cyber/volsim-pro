import MetaTrader5 as mt5
import time

def monitor_order(ticket, timeout=10):
    start_time = time.time()
    print(f'Monitoring order {ticket}...')
    
    while time.time() - start_time < timeout:
        positions = mt5.positions_get(ticket=ticket)
        if positions:
            print(f'Order {ticket} confirmed active.')
            return True
        
        # Check if it was closed or rejected
        history = mt5.history_orders_get(ticket=ticket)
        if history and history[0].state == mt5.ORDER_STATE_CANCELED:
            print(f'Order {ticket} was cancelled.')
            return False
            
        time.sleep(0.5)
    
    print(f'Timeout waiting for order {ticket}')
    return False

# Integrated into execute_order
def execute_order(cmd):
    # ... [previous logic to build request] ...
    result = mt5.order_send(request)
    
    if result.retcode == mt5.TRADE_RETCODE_DONE:
        # Pass the ticket to the monitor
        threading.Thread(target=monitor_order, args=(result.order,)).start()
        return result.order
    else:
        print(f'Initial request failed: {result.comment}')
        return None
