#STACKUP DEFI QUEST
App functionality:
 Overview of Script - Provide a detailed description of what the script does, highlighting the different DeFi protocols it interacts with and the overall workflow.
    Script swaps USDC for LINK on  uniswap & then opens a supply position on aave to start supplying link & earn interest.
    Step 1: Checks usdc balance after requesting how much you want to swap, if the value is correct, then prepares the params and performs the swap on uniswap.
    Step 2: Script Requests approval to allow the contract to spend x amount of tokens on behalf of the user in order to be able to open a supply position on aave.
    Step 3: Script opens supply position in aave for the x amount of LINK provided
    Step 4: Script provides the transaction receipt for verification.Don't trust, verify.
 Diagram Illustration - Include a diagram illustrating the sequence of steps and interactions between the protocols. This can be a flowchart or any visual representation that depicts the process
 --excalidraw to be used here
