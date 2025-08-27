// backend/src/main/java/grupo5/gestion_inventario/service/PurchaseOrderService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.PurchaseOrderItemRequest;
import grupo5.gestion_inventario.clientpanel.dto.PurchaseOrderRequest;

import grupo5.gestion_inventario.clientpanel.model.PurchaseOrder;
import grupo5.gestion_inventario.clientpanel.model.PurchaseOrderItem;
// 👇 OJO: usamos el Provider del mismo paquete "clientpanel.model" que usa PurchaseOrder
import grupo5.gestion_inventario.model.Provider;

import grupo5.gestion_inventario.model.Product;
import grupo5.gestion_inventario.clientpanel.model.ProviderBranch;
import grupo5.gestion_inventario.model.Sucursal;

import grupo5.gestion_inventario.clientpanel.repository.PurchaseOrderRepository;
// 👇 Elige UNO de estos dos según dónde esté tu repo real de Provider
import grupo5.gestion_inventario.repository.ProviderRepository;       // ← Opción B

import grupo5.gestion_inventario.repository.ProductRepository;
import grupo5.gestion_inventario.repository.ProviderBranchRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository  orderRepo;
    private final ProductRepository        productRepo;
    private final ProviderRepository       providerRepo;       // mismo paquete que el Provider usado arriba
    private final ProviderBranchRepository providerBranchRepo; // híbrido: vínculo proveedor↔sucursal
    private final SucursalRepository       sucursalRepo;

    public PurchaseOrderService(PurchaseOrderRepository orderRepo,
                                ProductRepository productRepo,
                                ProviderRepository providerRepo,
                                ProviderBranchRepository providerBranchRepo,
                                SucursalRepository sucursalRepo) {
        this.orderRepo          = orderRepo;
        this.productRepo        = productRepo;
        this.providerRepo       = providerRepo;
        this.providerBranchRepo = providerBranchRepo;
        this.sucursalRepo       = sucursalRepo;
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
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solicitud inválida");
        }
        if (req.getProviderId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falta providerId");
        }
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe incluir al menos un ítem");
        }

        // Sucursal
        Sucursal sucursal = sucursalRepo.findById(sucursalId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Sucursal no encontrada: " + sucursalId));

        // Proveedor (mismo CLIENT del de la sucursal)
        Provider provider = providerRepo.findById(req.getProviderId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Proveedor no encontrado: " + req.getProviderId()));

        if (provider.getClient() == null || !provider.getClient().getId().equals(sucursal.getClient().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El proveedor no pertenece al cliente de la sucursal");
        }

        // HÍBRIDO: vínculo proveedor↔sucursal ACTIVO
        ProviderBranch link = providerBranchRepo.findByProviderIdAndSucursalId(provider.getId(), sucursalId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "El proveedor no está vinculado a esta sucursal"));

        if (!link.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El proveedor está deshabilitado para esta sucursal");
        }

        // Cabecera
        PurchaseOrder order = new PurchaseOrder();
        order.setClient(sucursal.getClient());
        order.setSucursal(sucursal);
        order.setProvider(provider);
        // Si tu entidad tiene "status", setealo; si no, quita esta línea
        order.setStatus(PurchaseOrder.PurchaseOrderStatus.PENDING);
        // ❌ NO usamos setCreationDate (tu entidad no lo tiene). Si existe "setCreatedAt" o similar, cámbialo aquí.
        // order.setCreatedAt(new Date()); // <— si tu entidad lo soporta

        // Ítems
        for (PurchaseOrderItemRequest ir : req.getItems()) {
            // ⚠️ No compares con null si es primitivo (int)
            // cantidad
            if (ir.getQuantity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cantidad inválida en un ítem");
            }
            // costo (asumimos BigDecimal o Number no nulo desde el DTO)
            if (ir.getCost() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Costo faltante en un ítem");
            }

            Product product = productRepo.findById(ir.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Producto no encontrado: " + ir.getProductId()));

            if (product.getSucursal() == null || !product.getSucursal().getId().equals(sucursalId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "El producto " + ir.getProductId() + " no pertenece a la sucursal " + sucursalId);
            }

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

        // Si status es enum: OK. Si es int, ajusta la comparación.
        if (order.getStatus() != PurchaseOrder.PurchaseOrderStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Solo se pueden recibir órdenes en estado PENDING");
        }

        // Actualizar stock
        for (PurchaseOrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product.getSucursal() == null || !product.getSucursal().getId().equals(sucursalId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Un ítem no pertenece a esta sucursal");
            }
            product.setQuantity(product.getQuantity() + item.getQuantity());
        }

        order.setStatus(PurchaseOrder.PurchaseOrderStatus.RECEIVED);
        order.setReceptionDate(new Date()); // si tu entidad usa otro nombre, cámbialo

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
