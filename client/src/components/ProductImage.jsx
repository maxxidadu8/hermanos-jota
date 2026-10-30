const imagenAlternativa = "/assets/img/logo.svg";

function ProductImage({ imagenUrl, ...props }) {
  const url = imagenUrl?.trim();
  const src = !url ? imagenAlternativa : /^(https?:\/\/|\/)/i.test(url) ? url : `/${url}`;
  return (
    <img
      {...props}
      src={src}
      onError={(event) => {
        if (event.currentTarget.getAttribute("src") !== imagenAlternativa) {
          event.currentTarget.src = imagenAlternativa;
        }
      }}
    />
  );
}

export default ProductImage;
