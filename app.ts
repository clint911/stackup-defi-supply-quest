import { ethers, SigningKey, Wallet } from "ethers"
import dotenv from "dotenv"
import { type } from "os";
//--------------------------------FETCHING UNISWAP ABI --------------------------
//@ts-ignore
import FACTORY_ABI from "./utils/abis/factory.json" assert { type: "json" };
//@ts-ignore
import SWAP_ROUTER_ABI from "./utils/abis/swaprouter.json" assert { type: "json" };
//@ts-ignore
import POOL_ABI from "./utils/abis/pool.json" assert { type: "json" };
//@ts-ignore
import TOKEN_IN_ABI from "./utils/abis/token.json" assert { type: "json" };
//---------------------------FETCHING AAVE ABI --------------------------------
import POOLV3ARTIFACT from '@aave/core-v3/artifacts/contracts/protocol/pool/Pool.sol/Pool.json';
import * as pools from "@bgd-labs/aave-address-book";
import { AaveV3Sepolia } from "@bgd-labs/aave-address-book";

dotenv.config()

//lets introduce some basic configurations --provider, signer
const privateKey = process.env.PRIVATE_KEY;
const rpcUrl = process.env.RPC_URL;

//Addresses of the Contracts we're going to interact with
const POOL_FACTORY_CONTRACT_ADDRESS =
    "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";
const SWAP_ROUTER_CONTRACT_ADDRESS =
    "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";

//Setting up the provider & signers to use in our interactions
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
//@ts-ignore
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const factoryContract = new ethers.Contract(
    POOL_FACTORY_CONTRACT_ADDRESS,
    FACTORY_ABI,
    provider
);

//Part A - Input Token Configuration
const USDC = {
    chainId: 11155111,
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    decimals: 6,
    symbol: "USDC",
    name: "USD//C",
    isToken: true,
    isNative: true,
    wrapped: false,
};

const LINK = {
    chainId: 11155111,
    address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    decimals: 18,
    symbol: "LINK",
    name: "Chainlink",
    isToken: true,
    isNative: true,
    wrapped: false,
};

const linkTknSepoliaAddr = "0x779877A7B0D9E8603169DdbD7836e478b4624789";

//Part B - Write Approve Token Function
async function approveToken(tokenAddress, tokenABI, amount, wallet) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);
        const approveAmount = ethers.parseUnits(amount.toString(), USDC.decimals);
        const approveTransaction = await tokenContract.approve.populateTransaction(
            SWAP_ROUTER_CONTRACT_ADDRESS,
            approveAmount
        );
        const transactionResponse = await wallet.sendTransaction(
            approveTransaction
        );
        console.log(`-------------------------------`);
        console.log(`Sending Approval Transaction...`);
        console.log(`-------------------------------`);
        console.log(`Transaction Sent: ${transactionResponse.hash}`);
        console.log(`-------------------------------`);
        const receipt = await transactionResponse.wait();
        console.log(
            `Approval Transaction Confirmed! https://sepolia.etherscan.io/txn/${receipt.hash}`
        );
    } catch (error) {
        console.error("An error occurred during token approval:", error);
        throw new Error("Token approval failed");
    }
}

//Part C - Write Get Pool Info Function
async function getPoolInfo(factoryContract, tokenIn, tokenOut) {
    const poolAddress = await factoryContract.getPool(
        tokenIn.address,
        tokenOut.address,
        3000
    )
    if (!poolAddress) {
        throw new Error("Failed to get pool address");
    }
    const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
    const [token0, token1, fee] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
    ])
    return { poolContract, token0, token1, fee };
}

//Part D - Write Prepare Swap Params Function
async function prepareSwapParams(poolContract, signer, amountIn) {
    return {
        tokenIn: USDC.address,
        tokenOut: LINK.address,
        fee: await poolContract.fee(),
        recipient: signer.address,
        amountIn: amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    }
}

//Part E - Write Execute Swap Function
async function executeSwap(swapRouter, params, signer) {
    const transaction = await swapRouter.exactInputSingle.populateTransaction(
        params
    )
    const receipt = await signer.sendTransaction(transaction);
    console.log(`-------------------------------`);
    console.log(`Receipt: https://sepolia.etherscan.io/tx/${receipt.hash}`);
    console.log(`-------------------------------`);
}

//----Swapping complete now going to supplying assets  --echoes ERC20Approve spender: poolContract, amount: amount of assets we want to supply to be specified in function call curr = 10
//when calling the approve, the wallet is really the provider
async function approvePoolContractToSpend(AaveV3Sepolia, amount, wallet){
        const poolContract =  new ethers.Contract(AaveV3Sepolia, POOL_ABI, wallet)
        const approveAmount = ethers.parseUnits(amount.toString(), LINK.decimals);
        const approveTx = await poolContract.approve.populateTransaction(
        AaveV3Sepolia,
        amount
  );
  const txResponse = await wallet.sendTransaction(approvePoolContractToSpend);
//console.log();
}
//async function getAavePoolInfo(){}
//function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)
const supplyPoolContractAddress = "0xaA6a727e587D95ECC58E3594BDDAdF699BC9eAFd";
async function supplyAssetToAavePool(assetToProvide, amountToSupply, onBehalfOf, referralCode, AaveV3Sepolia, wallet){
        const poolContract =  new ethers.Contract(supplyPoolContractAddress, POOL_ABI, signer);
        const supplyTx = await poolContract.supply.populateTransaction(
        assetToProvide,
        amountToSupply,
        onBehalfOf,
        0,
    signer
  );
      const supplyTxRes = await wallet.sendTransaction(supplyTx);

}
//Part F - Write Main Function
async function main(swapAmount) {
    const inputAmount = 100;
    const amountIn = ethers.parseUnits(inputAmount.toString(), USDC.decimals);

    try {
        await approveToken(USDC.address, TOKEN_IN_ABI, inputAmount, signer);
        const { poolContract } = await getPoolInfo(factoryContract, USDC, LINK);
        const params = await prepareSwapParams(poolContract, signer, amountIn);
        const swapRouter = new ethers.Contract(
            SWAP_ROUTER_CONTRACT_ADDRESS,
            SWAP_ROUTER_ABI,
            signer
        )
        await executeSwap(swapRouter, params, signer)
    } catch (error) {
        console.error("An error occurred:", error.message)
    }
    //Setting up the main function to supply
    try {
       const approveTxRes =  await approvePoolContractToSpend(LINK.address, inputAmount, signer) ;      console.log(approveTxRes);
    console.log("pool spending approved for", signer);
  } catch (error) {
    console.error("Fatal Error pool contract spending approval failed", error.message);
  }
    try {
      const supplyTxRes = await supplyAssetToAavePool(LINK.address, amountIn, signer, 0, AaveV3Sepolia.POOL_ADDRESSES_PROVIDER, signer);
      console.log(supplyTxRes);

  } catch  (error){
    console.error("Fatal Error occurred", error.message);

  }
}

// Enter USDC AMOUNT TO SWAP FOR LINK
main(10);
