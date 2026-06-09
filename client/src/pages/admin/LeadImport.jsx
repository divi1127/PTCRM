import Layout from '../../components/Layout';
import MapModule from '../../components/MapModule';

export default function LocationMap() {
  return (
    <Layout title="TN Sports GIS" hideNavbar>
      <div className="w-full h-screen p-0 m-0 overflow-hidden">
        <MapModule />
      </div>
    </Layout>
  );
}
