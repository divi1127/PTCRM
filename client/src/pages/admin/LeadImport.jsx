import Layout from '../../components/Layout';
import MapModule from '../../components/MapModule';

export default function LocationMap() {
  return (
    <Layout title="TN Sports GIS" hideNavbar>
      {({ toggleSidebar }) => (
        <div className="w-full h-screen p-0 m-0 overflow-hidden flex flex-col">
          <MapModule toggleSidebar={toggleSidebar} />
        </div>
      )}
    </Layout>
  );
}
