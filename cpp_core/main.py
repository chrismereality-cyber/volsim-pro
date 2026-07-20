import sys
from shared_reader import SharedTickReader
import risk_engine

shared_file_path = r'C:\Users\hp\AppData\Roaming\MetaQuotes\Terminal\D0E8209F77C8CF37AD8BF550E51FF075\MQL5\Files\shared_mem_map.bin'

reader = SharedTickReader(shared_file_path)
engine = risk_engine.LiveRiskEngine() 

print('Monitoring: ' + shared_file_path)

while True:
    try:
        bid, ask, ts = reader.get_latest_tick()
        # Only process if we received valid values
        if bid is not None:
            engine.on_tick(bid, ask)
    except Exception as e:
        # This prevents the script from crashing on empty reads
        continue
