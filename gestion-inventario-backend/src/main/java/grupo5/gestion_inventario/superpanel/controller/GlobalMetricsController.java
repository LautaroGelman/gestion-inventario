package grupo5.gestion_inventario.superpanel.controller;

import grupo5.gestion_inventario.superpanel.dto.GlobalMetricsDTO;
import grupo5.gestion_inventario.superpanel.service.GlobalMetricsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
// 👇 CAMBIO AQUÍ: Añade "/api" al principio de la ruta.
@RequestMapping("/api/superpanel/metrics")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class GlobalMetricsController {

    @Autowired
    private GlobalMetricsService metricsService;

    @GetMapping
    public ResponseEntity<GlobalMetricsDTO> getGlobalMetrics() {
        GlobalMetricsDTO metrics = metricsService.getGlobalMetrics();
        return ResponseEntity.ok(metrics);
    }
}