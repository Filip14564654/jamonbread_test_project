import React, { useState, useEffect } from "react";
import "./styles.css";

interface Asset {
  asset: string;
  name: string;
  image: string;
  quantity: number;
  description: string;
}

interface WalletInputProps {
  wallet: string;
  setWallet: (wallet: string) => void;
  handleFetchAssets: () => void;
}

const WalletInput: React.FC<WalletInputProps> = ({ wallet, setWallet, handleFetchAssets }) => {
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleFetchAssets();
    }
  };

  return (
    <div className="wallet-input">
      <input
        type="text"
        placeholder="Enter wallet address"
        value={wallet}
        onChange={(e) => setWallet(e.target.value)}
        onKeyPress={handleKeyPress}
        className="input-box"
      />
      <button onClick={handleFetchAssets} className="submit-button">
        Submit
      </button>
    </div>
  );
};

const AssetsTable: React.FC<{ assets: Asset[] }> = ({ assets }) => {
  if (assets.length === 0) {
    return (
      <div className="assets-table">
        <p>No assets found.</p>
      </div>
    );
  }

  return (
    <div className="assets-table">
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Quantity</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset, index) => (
            <tr key={index}>
              <td>
                <img src={asset.image} alt={asset.name} className="asset-image" />
              </td>
              <td>{asset.name}</td>
              <td>{asset.quantity}</td>
              <td>{asset.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const WalletAssets: React.FC = () => {
  const [wallet, setWallet] = useState<string>(
    "addr1x88ttk0fk6ssan4g2uf2xtx3anppy3djftmkg959tufsc6qkqt76lg22kjjmnns37fmyue765qz347sxfnyks27ysqaqd3ph23"
  );
  const [assets, setAssets] = useState<Asset[]>([]);

  const DEFAULT_PLACEHOLDER = "https://placehold.co/50x50?text=No+Image";

  const fetchAssetDetails = async (assetId: string) => {
    try {
      const response = await fetch(
        `https://cardano-mainnet.blockfrost.io/api/v0/assets/${assetId}`,
        {
          headers: { project_id: "mainnetRUrPjKhpsagz4aKOCbvfTPHsF0SmwhLc" },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch asset details");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching asset details:", error);
      return null;
    }
  };

  const handleFetchAssets = async () => {
    if (!wallet) return;

    try {
      const response = await fetch(
        `https://cardano-mainnet.blockfrost.io/api/v0/addresses/${wallet}`,
        {
          headers: { project_id: "mainnetRUrPjKhpsagz4aKOCbvfTPHsF0SmwhLc" },
        }
      );

      if (!response.ok) {
        console.error("Wallet not found.");
        setAssets([]);
        return;
      }

      const data = await response.json();

      const fetchedAssets: (Asset | null)[] = await Promise.all(
        data.amount.map(async (item: any) => {
          const assetDetails = await fetchAssetDetails(item.unit);
          if (!assetDetails) return null;

          let imageUrl = DEFAULT_PLACEHOLDER;
          const ipfsCid = assetDetails?.onchain_metadata?.image;

          if (Array.isArray(ipfsCid) && ipfsCid.length === 2) {
            imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid[0].replace("ipfs://", "")}${ipfsCid[1]}`;
          } else if (typeof ipfsCid === "string" && ipfsCid.startsWith("ipfs://")) {
            imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid.replace("ipfs://", "")}`;
          }

          return {
            asset: item.unit,
            name: assetDetails?.onchain_metadata?.name || item.unit,
            image: imageUrl,
            quantity: parseInt(item.quantity, 10),
            description: assetDetails?.onchain_metadata?.description || "",
          };
        })
      );

      // Filter out any null assets
      setAssets(fetchedAssets.filter((asset): asset is Asset => asset !== null));
    } catch (error) {
      console.error("Error fetching assets:", error);
      setAssets([]);
    }
  };

  useEffect(() => {
    handleFetchAssets();
  }, []);

  return (
    <div className="container">
      <WalletInput wallet={wallet} setWallet={setWallet} handleFetchAssets={handleFetchAssets} />
      <AssetsTable assets={assets} />
    </div>
  );
};

export default WalletAssets;
