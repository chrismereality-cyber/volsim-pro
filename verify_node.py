from web3 import Web3

# Connect to your local Geth node via HTTP
w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))

# Verify connection
if w3.is_connected():
    print("Successfully connected to the local Geth node!")
    # Fetch the latest block number
    latest_block = w3.eth.block_number
    print(f"Current Block Number: {latest_block}")
    
    # Check your node's sync status
    syncing = w3.eth.syncing
    if syncing:
        print(f"Node is still syncing: {syncing}")
    else:
        print("Node is fully synchronized.")
else:
    print("Failed to connect. Please ensure Geth is running with --http and --http.port 8545.")
