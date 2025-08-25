// backend/src/main/java/grupo5/gestion_inventario/service/PurchaseOrderService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.PurchaseOrderItemRequest;
import grupo5.gestion_inventario.clientpanel.dto.PurchaseOrderRequest;
import grupo5.gestion_inventario.clientpanel.model.*;
import grupo5.gestion_inventario.model.Product;
import grupo5.gestion_inventario.model.Sucursal;
import grupo5.gestion_inventario.repository.ProductRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.clientpanel.repository.ProviderRepository;
import grupo5.gestion_inventario.clientpanel.repository.PurchaseOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository orderRepo;
    private final ProductRepository       productRepo;
    private final ProviderRepository      providerRepo;
    private final SucursalRepository      sucursalRepo;

    public PurchaseOrderService(PurchaseOrderRepository orderRepo,
                                ProductRepository       productRepo,
                                ProviderRepository      providerRepo,
                                SucursalRepository      sucursalRepo) {
        this.orderRepo   = orderRepo;
        this.productRepo = productRepo;
        this.providerRepo= providerRepo;
        this.sucursalRepo= sucursalRepo;
    }

    /* ------------------------------------------------------------------
     *  LECTURA
     * ------------------------------------------------------------------ */
    @Transactional(readOnly = true)
    public Optional<PurchaseOrder> getPurchaseOrderById(Long orderId, Long sucursalId) {
        confirmarSucursalExiste(sucursalId);
        return orderRepo.findByIdAndSucursalId(orderId, sucursalId);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrder> findAllBySucursalId(Long sucursalId) {
        confirmarSucursalExiste(sucursalId);
        return orderRepo.findBySucursalId(sucursalId);
    }

    /* ------------------------------------------------------------------
     *  CREAR ORDEN DE COMPRA
     * ------------------------------------------------------------------ */
    @Transactional
    public PurchaseOrder create(Long sucursalId, PurchaseOrderRequest req) {

        Sucursal sucursal = sucursalRepo.findById(sucursalId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Sucursal no encontrada: " + sucursalId));

        Provider provider = providerRepo.findById(req.getProviderId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Proveedor no encontrado: " + req.getProviderId()));

        PurchaseOrder order = new PurchaseOrder();
        order.setClient  (sucursal.getClient());
        order.setSucursal(sucursal);
        order.setProvider(provider);

        for (PurchaseOrderItemRequest ir : req.getItems()) {
            Product product = productRepo.findById(ir.getProductId())
                    .filter(p -> p.getSucursal().getId().equals(sucursalId))
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Producto no pertenece a esta sucursal: " + ir.getProductId()));

            PurchaseOrderItem item = new PurchaseOrderItem(
                    order,
                    product,
                    ir.getQuantity(),
                    ir.getCost()
            );
            order.addItem(item);
        }

        return orderRepo.save(order);
    }

    /* ------------------------------------------------------------------
     *  RECIBIR ORDEN DE COMPRA
     * ------------------------------------------------------------------ */
    @Transactional
    public PurchaseOrder receive(Long orderId, Long sucursalId) {

        PurchaseOrder order = orderRepo.findByIdAndSucursalId(orderId, sucursalId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Orden no encontrada o no pertenece a la sucursal"));

        if (order.getStatus() != PurchaseOrder.PurchaseOrderStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Solo se pueden recibir órdenes de compra pendientes");
        }

        /* actualizar quantity */
        for (PurchaseOrderItem item : order.getItems()) {
            Product product = item.getProduct();
            int newQty = product.getQuantity() + item.getQuantity();
            product.setQuantity(newQty);
        }

        order.setStatus       (PurchaseOrder.PurchaseOrderStatus.RECEIVED);
        order.setReceptionDate(new Date());

        return orderRepo.save(order);
    }

    /* ------------------------------------------------------------------
     *  HELPERS
     * ------------------------------------------------------------------ */
    private void confirmarSucursalExiste(Long id) {
        if (!sucursalRepo.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Sucursal no encontrada: " + id);
        }
    }
}
