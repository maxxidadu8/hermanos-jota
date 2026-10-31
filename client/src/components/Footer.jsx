import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="brand footer-brand" to="/">
          <img src="/assets/img/logo.svg" alt="" />
          <span>Hermanos Jota</span>
        </Link>
      </div>
      <div className="footer-info">
        <span>Av. San Juan 2847 · CABA</span>
        <a href="mailto:info@hermanosjota.com.ar">info@hermanosjota.com.ar</a>
        <a href="https://www.instagram.com/hermanosjota_ba/" target="_blank" rel="noopener">
          @hermanosjota_ba
        </a>
        <span>© 2026 Hermanos Jota</span>
      </div>
    </footer>
  );
}

export default Footer;
