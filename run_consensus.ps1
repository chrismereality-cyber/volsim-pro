# Start Lighthouse with Checkpoint Sync
# Replace the URL if needed, but this is a stable public endpoint.
.\lighthouse.exe bn 
  --execution-endpoint http://localhost:8551 
  --execution-jwt C:\Users\hp\AppData\Local\Ethereum\geth\jwtsecret 
  --checkpoint-sync-url https://mainnet.checkpoint.sigp.io 
  --disable-enr-auto-update 
  --enr-address 127.0.0.1 
  --enr-udp-port 9000 
  --enr-tcp-port 9000 
  --port 9000 
  --metrics
