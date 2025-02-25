import React, { useState } from "react";
import "./styles.css"; // Import custom CSS file

interface Asset {
  asset: string;
  name: string;
  image: string;
  quantity: number;
  description: string;
}

const WalletInput: React.FC<{ wallet: string; setWallet: (wallet: string) => void; handleFetchAssets: () => void }> = ({ wallet, setWallet, handleFetchAssets }) => (
  <div className="wallet-input">
    <input 
      type="text"
      placeholder="Enter wallet address"
      value={wallet}
      onChange={(e) => setWallet(e.target.value)}
      className="input-box"
    />
    <button 
      onClick={handleFetchAssets} 
      className="submit-button">
      Submit
    </button>
  </div>
);

const AssetsTable: React.FC<{ assets: Asset[] }> = ({ assets }) => (
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

const WalletAssets: React.FC = () => {
  const [wallet, setWallet] = useState<string>("");
  const [assets, setAssets] = useState<Asset[]>([]);

  const fetchAssetDetails = async (assetId: string) => {
    try {
      const response = await fetch(`https://cardano-mainnet.blockfrost.io/api/v0/assets/${assetId}`, {
        headers: { "project_id": "mainnetRUrPjKhpsagz4aKOCbvfTPHsF0SmwhLc" }
      });
      if (!response.ok) throw new Error("Failed to fetch asset details");
      const assetData = await response.json();
      
      if (!assetData.onchain_metadata || !assetData.onchain_metadata.image) {
        throw new Error("Not an NFT or missing metadata");
      }
      
      return assetData;
    } catch (error) {
      console.error("Error fetching asset details:", error);
      return null;
    }
  };

  const handleFetchAssets = async () => {
    if (!wallet) return;

    try {
      const response = await fetch(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${wallet}`, {
        headers: { "project_id": "mainnetRUrPjKhpsagz4aKOCbvfTPHsF0SmwhLc" }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }
      
      const data = await response.json();
      const fetchedAssets: Asset[] = await Promise.all(
        data.amount.map(async (item: any) => {
          const assetDetails = await fetchAssetDetails(item.unit);
          if (!assetDetails) return null;
          
          const ipfsCid = assetDetails?.onchain_metadata?.image;
          console.log(`https://ipfs.io/ipfs/${ipfsCid.replace("ipfs://", "")}`);
          return {
            asset: item.unit,
            name: assetDetails?.onchain_metadata?.name || item.unit,
            image: ipfsCid ? `https://ipfs.io/ipfs/${ipfsCid.replace("ipfs://", "")}` : "https://via.placeholder.com/50",
            quantity: parseInt(item.quantity, 10),
            description: assetDetails?.onchain_metadata?.description || "Not an NFT or no description available",
          };
        })
      );
      
      setAssets(fetchedAssets.filter(asset => asset !== null));
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  return (
    <div className="container">
      <WalletInput wallet={wallet} setWallet={setWallet} handleFetchAssets={handleFetchAssets} />
      <AssetsTable assets={assets} />
    </div>
  );
};

export default WalletAssets;
