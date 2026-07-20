import struct
import os

class SharedTickReader:
    def __init__(self, file_path=r'C:\Users\hp\AppData\Roaming\MetaQuotes\Terminal\D0E8209F77C8CF37AD8BF550E51FF075\MQL5\Files\shared_mem_map.bin'):
        self.file_path = file_path

    def get_latest_tick(self):
        if not os.path.exists(self.file_path):
            return None, None, None
            
        with open(self.file_path, 'rb') as f:
            f.seek(0, os.SEEK_END)
            file_size = f.tell()
            if file_size < 24:
                return None, None, None
            f.seek(file_size - 24)
            data = f.read(24)
        
        # 'ddd' = 3 doubles (8 bytes each). 
        # If your MT5 uses a different format, change this string.
        return struct.unpack('ddd', data)
