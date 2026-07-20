#property strict

struct TickData {
    double bid;
    double ask;
    long   timestamp;
};

int OnInit() { return(INIT_SUCCEEDED); }
void OnDeinit(const int reason) {}

void OnTick() {
    // Using a relative path: file must exist in MQL5/Files/
    int file_handle = FileOpen(""shared_mem_map.bin"", FILE_READ|FILE_WRITE|FILE_BIN|FILE_SHARE_WRITE|FILE_SHARE_READ);
    
    if(file_handle != INVALID_HANDLE) {
        TickData tick;
        tick.bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
        tick.ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
        tick.timestamp = (long)TimeCurrent();
        
        FileSeek(file_handle, 0, SEEK_SET);
        FileWriteStruct(file_handle, tick);
        FileFlush(file_handle);
        FileClose(file_handle);
    }
}
