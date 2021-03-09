import { expect } from "chai"
import { ethers } from "ethers"
import AmmArtifact from "../../build/contracts/Amm.json"
import ChainlinkL1Artifact from "../../build/contracts/ChainlinkL1.json"
import ClearingHouseArtifact from "../../build/contracts/ClearingHouse.json"
import ClientBridgeArtifact from "../../build/contracts/ClientBridge.json"
import InsuranceFundArtifact from "../../build/contracts/InsuranceFund.json"
import L2PriceFeedArtifact from "../../build/contracts/L2PriceFeed.json"
import MetaTxGatewayArtifact from "../../build/contracts/MetaTxGateway.json"
import OwnableArtifact from "../../build/contracts/Ownable.json"
import RootBridgeArtifact from "../../build/contracts/RootBridge.json"
import { AmmInstanceName, ContractName } from "../../publish/ContractName"
import { SettingsDao } from "../../publish/SettingsDao"
import { SystemMetadataDao } from "../../publish/SystemMetadataDao"
import { Layer } from "../../scripts/common"
import {
    Amm,
    ChainlinkL1,
    ClearingHouse,
    ClientBridge,
    InsuranceFund,
    L2PriceFeed,
    MetaTxGateway,
    Ownable,
    RootBridge,
} from "../../types/ethers"

const LAYER_1 = "mainnet"
const XDAI_URL = "https://rpc.xdaichain.com/"
const XDAI_NAME = "xdai"
const XDAI_CHAINID = 100
const STAGE = "production"

// TODO move to another monitor repo
describe.skip("SystemTest Spec", () => {
    const l1Provider = ethers.getDefaultProvider(LAYER_1)
    const l2Provider = new ethers.providers.JsonRpcProvider(XDAI_URL, { name: XDAI_NAME, chainId: XDAI_CHAINID })
    const settingsDao: SettingsDao = new SettingsDao(STAGE)
    const systemMetadataDao: SystemMetadataDao = new SystemMetadataDao(settingsDao)

    const perpToken = settingsDao.getExternalContracts(Layer.Layer1).perp!
    const chainLinkL1 = systemMetadataDao.getContractMetadata(Layer.Layer1, ContractName.ChainlinkL1)
    const rootBridge = systemMetadataDao.getContractMetadata(Layer.Layer1, ContractName.RootBridge)
    const multiTokenMediatorL1 = settingsDao.getExternalContracts(Layer.Layer1).multiTokenMediatorOnEth
    const ambBridgeL1 = settingsDao.getExternalContracts(Layer.Layer1).ambBridgeOnEth

    const l2PriceFeed = systemMetadataDao.getContractMetadata(Layer.Layer2, ContractName.L2PriceFeed)
    const metaTxGateway = systemMetadataDao.getContractMetadata(Layer.Layer2, ContractName.MetaTxGateway)
    const insuranceFund = systemMetadataDao.getContractMetadata(Layer.Layer2, ContractName.InsuranceFund)
    const clearingHouse = systemMetadataDao.getContractMetadata(Layer.Layer2, ContractName.ClearingHouse)
    const clientBridge = systemMetadataDao.getContractMetadata(Layer.Layer2, ContractName.ClientBridge)
    const ETHUSDC = systemMetadataDao.getContractMetadata(Layer.Layer2, AmmInstanceName.ETHUSDC)
    const BTCUSDC = systemMetadataDao.getContractMetadata(Layer.Layer2, AmmInstanceName.BTCUSDC)
    const YFIUSDC = systemMetadataDao.getContractMetadata(Layer.Layer2, AmmInstanceName.YFIUSDC)
    const DOTUSDC = systemMetadataDao.getContractMetadata(Layer.Layer2, AmmInstanceName.DOTUSDC)
    const SNXUSDC = systemMetadataDao.getContractMetadata(Layer.Layer2, AmmInstanceName.SNXUSDC)
    const ambBridgeL2 = settingsDao.getExternalContracts(Layer.Layer2).ambBridgeOnXDai
    const multiTokenMediatorL2 = settingsDao.getExternalContracts(Layer.Layer2).multiTokenMediatorOnXDai
    const usdc = settingsDao.getExternalContracts(Layer.Layer2).usdc
    const multiTokenMediator = settingsDao.getExternalContracts(Layer.Layer2).multiTokenMediatorOnXDai

    describe("RootBridge", () => {
        let instance: RootBridge

        beforeEach(async () => {
            instance = new ethers.Contract(rootBridge.address, RootBridgeArtifact.abi, l1Provider) as RootBridge
        })

        it("has ChainlinkL1", async () => {
            expect(await instance.priceFeed()).to.eq(chainLinkL1.address)
        })

        it("has ambBridgeL1", async () => {
            expect(await instance.ambBridge()).to.eq(ambBridgeL1)
        })

        it("has MultiTokenMediatorL1", async () => {
            expect(await instance.multiTokenMediator()).to.eq(multiTokenMediatorL1)
        })

        it("own by gov", async () => {
            expect(await instance.owner()).eq(settingsDao.getExternalContracts(Layer.Layer1).foundationGovernance)
        })
    })

    describe("ChainlinkL1", () => {
        let instance: ChainlinkL1

        beforeEach(async () => {
            instance = new ethers.Contract(chainLinkL1.address, ChainlinkL1Artifact.abi, l1Provider) as ChainlinkL1
        })

        it("has RootBridge", async () => {
            expect(await instance.rootBridge()).to.eq(rootBridge.address)
        })

        it("has priceFeedL2Address", async () => {
            expect(await instance.priceFeedL2Address()).to.eq(l2PriceFeed.address)
        })

        it("own by gov", async () => {
            expect(await instance.owner()).eq(settingsDao.getExternalContracts(Layer.Layer1).foundationGovernance)
        })
    })

    describe("MetaTxGateway", async () => {
        let instance: MetaTxGateway

        beforeEach(async () => {
            instance = new ethers.Contract(
                metaTxGateway.address,
                MetaTxGatewayArtifact.abi,
                l2Provider,
            ) as MetaTxGateway
        })

        // with function isInWhitelists(), as whitelistMap is private
        it("has ClientBridge as whitelistMap", async () => {
            expect(await instance.isInWhitelists(clientBridge.address))
        })

        it("own by gov", async () => {
            expect(await instance.owner()).eq(settingsDao.getExternalContracts(Layer.Layer2).foundationGovernance)
        })
    })

    describe("ClientBridge", async () => {
        let instance: ClientBridge

        beforeEach(async () => {
            instance = new ethers.Contract(clientBridge.address, ClientBridgeArtifact.abi, l2Provider) as ClientBridge
        })

        it("has ambBridge", async () => {
            expect(await instance.ambBridge()).to.eq(ambBridgeL2)
        })

        it("has MultiTokenMediatorL2", async () => {
            expect(await instance.multiTokenMediator()).to.eq(multiTokenMediatorL2)
        })

        it("has TrustedForwarder", async () => {
            expect(await instance.isTrustedForwarder(metaTxGateway.address))
        })

        it("own by gov", async () => {
            expect(await instance.owner()).eq(settingsDao.getExternalContracts(Layer.Layer2).foundationGovernance)
        })
    })

    describe("InsuranceFund", async () => {
        let instance: InsuranceFund

        beforeEach(async () => {
            instance = new ethers.Contract(
                insuranceFund.address,
                InsuranceFundArtifact.abi,
                l2Provider,
            ) as InsuranceFund
        })

        // with function isExistedAmm(), as amms are private
        describe("has amms", async () => {
            it("has ETHUSDC", async () => {
                expect(await instance.isExistedAmm(ETHUSDC.address))
            })

            it("has BTCUSDC", async () => {
                expect(await instance.isExistedAmm(BTCUSDC.address))
            })

            it("has YFIUSDC", async () => {
                expect(await instance.isExistedAmm(YFIUSDC.address))
            })

            it("has DOTUSDC", async () => {
                expect(await instance.isExistedAmm(DOTUSDC.address))
            })
        })

        it("has USDC as quoteTokens[0]", async () => {
            expect(await instance.quoteTokens(0)).to.eq(usdc)
        })

        // not yet implemented
        it.skip("has exchange", async () => {})

        // there is no perp token on rinkeby?
        it.skip("has perpToken", async () => {
            expect(await instance.perpToken()).to.eq(perpToken)
        })

        // not yet implemented
        it.skip("has minter", async () => {})

        // not yet implemented
        it.skip("has inflationMonitor", async () => {})

        it("own by gov", async () => {
            expect(await instance.owner()).eq(settingsDao.getExternalContracts(Layer.Layer2).foundationGovernance)
        })
    })

    describe("L2PriceFeed", async () => {
        let instance: L2PriceFeed

        beforeEach(async () => {
            instance = new ethers.Contract(l2PriceFeed.address, L2PriceFeedArtifact.abi, l2Provider) as L2PriceFeed
        })

        it("has rootBridge", async () => {
            expect(await instance.rootBridge()).to.eq(rootBridge.address)
        })

        it("has ambBridgeL2", async () => {
            expect(await instance.ambBridge()).to.eq(ambBridgeL2)
        })

        it("own by gov", async () => {
            expect(await instance.owner()).eq(settingsDao.getExternalContracts(Layer.Layer2).foundationGovernance)
        })
    })

    describe("ClearingHouse", async () => {
        let instance: ClearingHouse

        beforeEach(async () => {
            instance = new ethers.Contract(
                clearingHouse.address,
                ClearingHouseArtifact.abi,
                l2Provider,
            ) as ClearingHouse
        })

        // for arbitrageurs, not yet implemented
        it("has EOA/arbitrageurs as whitelistMap", async () => {})

        // private
        it("has amms", async () => {})

        // not yet implemented
        it.skip("has StakingReserve as feePool", async () => {
            expect(await instance.feePool()).to.eq(multiTokenMediator)
        })

        it("has InsuranceFund", async () => {
            expect(await instance.insuranceFund()).to.eq(insuranceFund.address)
        })

        it("own by gov", async () => {
            expect(await instance.owner()).eq(settingsDao.getExternalContracts(Layer.Layer2).foundationGovernance)
        })
    })

    describe("Amm", async () => {
        describe("ETHUSDC", async () => {
            let instance: Amm

            beforeEach(async () => {
                instance = new ethers.Contract(ETHUSDC.address, AmmArtifact.abi, l2Provider) as Amm
            })

            // private
            it.skip("has ClearingHouse as counterParty", async () => {})

            it("has quoteAsset", async () => {
                expect(await instance.quoteAsset()).to.eq(usdc)
            })

            it("has L2PriceFeed", async () => {
                expect(await instance.priceFeed()).to.eq(l2PriceFeed.address)
            })

            it("own by gov", async () => {
                expect(await instance.owner()).eq(settingsDao.getExternalContracts(Layer.Layer2).foundationGovernance)
            })

            it("has correct config", async () => {
                expect(await instance.tradeLimitRatio()).eq(ethers.utils.parseEther("0.9").toString())
                expect(await instance.fluctuationLimitRatio()).eq(ethers.utils.parseEther("0.012").toString())
                expect(await instance.tollRatio()).eq(ethers.utils.parseEther("0").toString())
                expect(await instance.spreadRatio()).eq(ethers.utils.parseEther("0.001").toString())
                expect((await instance.getMaxHoldingBaseAsset()).d.toString()).eq(
                    ethers.utils.parseEther("20").toString(),
                )
                expect((await instance.getOpenInterestNotionalCap()).d.toString()).eq(
                    ethers.utils.parseEther("2500000").toString(),
                )
            })
        })

        describe("BTCUSDC", async () => {
            let instance: Amm

            beforeEach(async () => {
                instance = new ethers.Contract(BTCUSDC.address, AmmArtifact.abi, l2Provider) as Amm
            })

            // private
            it.skip("has ClearingHouse", async () => {})

            it("has quoteAsset", async () => {
                expect(await instance.quoteAsset()).to.eq(usdc)
            })

            it("has L2PriceFeed", async () => {
                expect(await instance.priceFeed()).to.eq(l2PriceFeed.address)
            })

            it("own by gov", async () => {
                expect(await instance.owner()).eq(settingsDao.getExternalContracts(Layer.Layer2).foundationGovernance)
            })

            it("has correct config", async () => {
                expect(await instance.tradeLimitRatio()).eq(ethers.utils.parseEther("0.9").toString())
                expect(await instance.fluctuationLimitRatio()).eq(ethers.utils.parseEther("0.012").toString())
                expect(await instance.tollRatio()).eq(ethers.utils.parseEther("0").toString())
                expect(await instance.spreadRatio()).eq(ethers.utils.parseEther("0.001").toString())
                expect((await instance.getMaxHoldingBaseAsset()).d.toString()).eq(
                    ethers.utils.parseEther("0.5").toString(),
                )
                expect((await instance.getOpenInterestNotionalCap()).d.toString()).eq(
                    ethers.utils.parseEther("3000000").toString(),
                )
            })
        })

        describe("YFIUSDC", async () => {
            let instance: Amm

            beforeEach(async () => {
                instance = new ethers.Contract(YFIUSDC.address, AmmArtifact.abi, l2Provider) as Amm
            })

            // private
            it.skip("has ClearingHouse", async () => {})

            it("has quoteAsset", async () => {
                expect(await instance.quoteAsset()).to.eq(usdc)
            })

            it("has L2PriceFeed", async () => {
                expect(await instance.priceFeed()).to.eq(l2PriceFeed.address)
            })

            it("own by gov", async () => {
                expect(await instance.owner()).eq(settingsDao.getExternalContracts(Layer.Layer2).foundationGovernance)
            })

            it("has correct config", async () => {
                expect(await instance.tradeLimitRatio()).eq(ethers.utils.parseEther("0.9").toString())
                expect(await instance.fluctuationLimitRatio()).eq(ethers.utils.parseEther("0.012").toString())
                expect(await instance.tollRatio()).eq(ethers.utils.parseEther("0").toString())
                expect(await instance.spreadRatio()).eq(ethers.utils.parseEther("0.001").toString())
                expect((await instance.getMaxHoldingBaseAsset()).d.toString()).eq(
                    ethers.utils.parseEther("0.5").toString(),
                )
                expect((await instance.getOpenInterestNotionalCap()).d.toString()).eq(
                    ethers.utils.parseEther("1000000").toString(),
                )
            })
        })

        describe("DOTUSDC", async () => {
            let instance: Amm

            beforeEach(async () => {
                instance = new ethers.Contract(DOTUSDC.address, AmmArtifact.abi, l2Provider) as Amm
            })

            // private
            it.skip("has ClearingHouse", async () => {})

            it("has quoteAsset", async () => {
                expect(await instance.quoteAsset()).to.eq(usdc)
            })

            it("has L2PriceFeed", async () => {
                expect(await instance.priceFeed()).to.eq(l2PriceFeed.address)
            })

            it("own by gov", async () => {
                expect(await instance.owner()).eq(settingsDao.getExternalContracts(Layer.Layer2).foundationGovernance)
            })

            it("has correct config", async () => {
                expect(await instance.tradeLimitRatio()).eq(ethers.utils.parseEther("0.9").toString())
                expect(await instance.fluctuationLimitRatio()).eq(ethers.utils.parseEther("0.012").toString())
                expect(await instance.tollRatio()).eq(ethers.utils.parseEther("0").toString())
                expect(await instance.spreadRatio()).eq(ethers.utils.parseEther("0.001").toString())
                expect((await instance.getMaxHoldingBaseAsset()).d.toString()).eq(
                    ethers.utils.parseEther("5000").toString(),
                )
                expect((await instance.getOpenInterestNotionalCap()).d.toString()).eq(
                    ethers.utils.parseEther("2000000").toString(),
                )
            })
        })

        describe("SNXUSDC", async () => {
            let instance: Amm

            beforeEach(async () => {
                instance = new ethers.Contract(SNXUSDC.address, AmmArtifact.abi, l2Provider) as Amm
            })

            // private
            it.skip("has ClearingHouse", async () => {})

            it("has quoteAsset", async () => {
                expect(await instance.quoteAsset()).to.eq(usdc)
            })

            it("has L2PriceFeed", async () => {
                expect(await instance.priceFeed()).to.eq(l2PriceFeed.address)
            })

            it("own by gov", async () => {
                expect(await instance.owner()).eq(settingsDao.getExternalContracts(Layer.Layer2).foundationGovernance)
            })

            it("has correct config", async () => {
                expect(await instance.tradeLimitRatio()).eq(ethers.utils.parseEther("0.9").toString())
                expect(await instance.fluctuationLimitRatio()).eq(ethers.utils.parseEther("0.012").toString())
                expect(await instance.tollRatio()).eq(ethers.utils.parseEther("0").toString())
                expect(await instance.spreadRatio()).eq(ethers.utils.parseEther("0.001").toString())
                expect((await instance.getMaxHoldingBaseAsset()).d.toString()).eq(
                    ethers.utils.parseEther("6000").toString(),
                )
                expect((await instance.getOpenInterestNotionalCap()).d.toString()).eq(
                    ethers.utils.parseEther("2000000").toString(),
                )
            })
        })
    })

    describe("proxyAdmin", () => {
        it("own by gov at L1", async () => {
            const proxyAdminOnEth = settingsDao.getExternalContracts(Layer.Layer1).proxyAdmin!
            const instance = new ethers.Contract(proxyAdminOnEth, OwnableArtifact.abi, l1Provider) as Ownable
            const owner = await instance.owner()
            const gov = settingsDao.getExternalContracts(Layer.Layer1).foundationGovernance
            expect(owner).eq(gov)
        })

        it("own by gov at L2", async () => {
            const proxyAdminOnXdai = settingsDao.getExternalContracts(Layer.Layer2).proxyAdmin!
            const instance = new ethers.Contract(proxyAdminOnXdai, OwnableArtifact.abi, l2Provider) as Ownable
            const owner = await instance.owner()
            const gov = settingsDao.getExternalContracts(Layer.Layer2).foundationGovernance
            expect(owner).eq(gov)
        })
    })
})
