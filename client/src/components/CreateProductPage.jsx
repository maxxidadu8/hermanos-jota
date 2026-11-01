import ProductForm from "./ProductForm.jsx";

function CreateProductPage({ onCreado }) {
  return <ProductForm onGuardado={onCreado} />;
}

export default CreateProductPage;
