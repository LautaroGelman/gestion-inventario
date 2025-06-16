package grupo5.gestion_inventario.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaForwardingController {

    /**
     * Este método reenvía todas las solicitudes que NO son de la API
     * (es decir, no empiezan con /api) y NO son para archivos estáticos
     * (no contienen un punto) al punto de entrada de la SPA (index.html).
     * Esto permite que React Router maneje el enrutamiento del lado del cliente.
     */
    @RequestMapping(value = "/{path:^(?!api|assets|static).*}/**")
    public String forward() {
        // Reenvía a la raíz, que servirá el index.html
        return "forward:/";
    }
}