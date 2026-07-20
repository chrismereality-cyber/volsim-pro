// --- MQL5 Shared Memory Write Snippet ---
int file_handle = FileOpen("shared_mem_map.bin", FILE_WRITE|FILE_BIN|FILE_SHARE_READ|FILE_SHARE_WRITE);
if(file_handle != INVALID_HANDLE)
{
    // Write Bid, Ask, and timestamp as doubles for Python compatibility
    FileWriteDouble(file_handle, SymbolInfoDouble(_Symbol, SYMBOL_BID));
    FileWriteDouble(file_handle, SymbolInfoDouble(_Symbol, SYMBOL_ASK));
    FileWriteDouble(file_handle, (double)TimeCurrent()); 
    
    FileFlush(file_handle); // CRITICAL: Forces data to be written
    FileClose(file_handle);
}
