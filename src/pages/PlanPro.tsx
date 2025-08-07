import { Layout } from '@/components/Layout';

const PlanPro = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-8">Plan Pro</h1>
            <div className="bg-white rounded-lg shadow-card p-8">
              <p className="text-muted-foreground">Contenido del Plan Pro</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PlanPro;