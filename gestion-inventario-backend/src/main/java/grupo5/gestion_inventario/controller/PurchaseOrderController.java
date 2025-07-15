package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.clientpanel.dto.PurchaseOrderRequest;
import grupo5.gestion_inventario.clientpanel.model.PurchaseOrder;
import grupo5.gestion_inventario.config.JwtUtil;
import grupo5.gestion_inventario.service.PurchaseOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
@CrossOrigin(origins = "http://localhost:3000")
@PreAuthorize("hasAnyRole('CLIENT','ADMINISTRADOR','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')")
public class PurchaseOrderController {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<PurchaseOrder>> getAllPurchaseOrders(@RequestHeader("Authorization") String authHeader) {
        Long clientId = jwtUtil.extractClientId(authHeader.substring(7));
        List<PurchaseOrder> purchaseOrders = purchaseOrderService.findAllByClientId(clientId);
        return ResponseEntity.ok(purchaseOrders);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT','ADMINISTRADOR','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')")
    public ResponseEntity<PurchaseOrder> getPurchaseOrderById(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        // Opcional: validar clientId aquí si es necesario
        return purchaseOrderService.getPurchaseOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENT','ADMINISTRADOR','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')")
    public ResponseEntity<PurchaseOrder> createPurchaseOrder(
            @RequestBody PurchaseOrderRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long clientId = jwtUtil.extractClientId(authHeader.substring(7));
        PurchaseOrder newPurchaseOrder = purchaseOrderService.createPurchaseOrder(clientId, request);
        return new ResponseEntity<>(newPurchaseOrder, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('CLIENT','ADMINISTRADOR','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')")
    public ResponseEntity<PurchaseOrder> receivePurchaseOrder(
            @PathVariable Long id) {
        PurchaseOrder updatedPurchaseOrder = purchaseOrderService.receivePurchaseOrder(id);
        return ResponseEntity.ok(updatedPurchaseOrder);
    }
}
