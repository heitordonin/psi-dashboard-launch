const PlansLoading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p className="mt-4">Carregando planos...</p>
      </div>
    </div>
  );
};

export default PlansLoading;