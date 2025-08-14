// backend/src/main/java/grupo5/gestion_inventario/service/SaleReturnService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.ReturnItemDto;
import grupo5.gestion_inventario.clientpanel.dto.SaleReturnDto;
import grupo5.gestion_inventario.clientpanel.dto.SaleReturnRequest;
import grupo5.gestion_inventario.clientpanel.model.*;
import grupo5.gestion_inventario.clientpanel.repository.SaleRepository;
import grupo5.gestion_inventario.clientpanel.repository.SaleReturnRepository;
import grupo5.gestion_inventario.model.Product;
import grupo5.gestion_inventario.repository.ProductRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SaleReturnService {

    private final SaleReturnRepository saleReturnRepo;
    private final SaleRepository       saleRepo;
    private final ProductRepository    productRepo;
    private final SucursalRepository   sucursalRepo;

    public SaleReturnService(SaleReturnRepository saleReturnRepo,
                             SaleRepository       saleRepo,
                             ProductRepository    productRepo,
                             SucursalRepository   sucursalRepo) {
        this.saleReturnRepo = saleReturnRepo;
        this.saleRepo       = saleRepo;
        this.productRepo    = productRepo;
        this.sucursalRepo   = sucursalRepo;
    }

    /* ============================================================
     *  REGISTRAR DEVOLUCIÓN
     * ============================================================ */
    @Transactional
    public SaleReturnDto createSaleReturn(SaleReturnRequest req) {

        /* 1) Recuperar y validar la venta para la sucursal */
        Sale sale = saleRepo.findByIdAndSucursalId(
                        req.getSaleId(), req.getSucursalId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Venta no encontrada (id=" + req.getSaleId() + ", sucursal="
                                + req.getSucursalId() + ")"));

        /* 2) Cabecera de devolución */
        SaleReturn saleReturn = new SaleReturn(
                sale,
                sale.getClient(),
                LocalDateTime.now(),
                req.getReason()
        );

        /* 3) Procesar cada item devuelto */
        req.getItems().forEach(itemReq -> {

            SaleItem soldItem = sale.getItems().stream()
                    .filter(si -> si.getId().equals(itemReq.getSaleItemId()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Item de venta no encontrado: " + itemReq.getSaleItemId()));

            Product product = soldItem.getProduct();

            if (!product.getSucursal().getId().equals(req.getSucursalId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El producto no pertenece a la sucursal");
            }

            /* Ajuste de stock */
            product.setQuantity(product.getQuantity() + itemReq.getQuantity());

            /* Crear ítem de devolución */
            SaleReturnItem returnItem = new SaleReturnItem(
                    saleReturn,
                    soldItem,
                    product,
                    itemReq.getQuantity(),
                    soldItem.getUnitPrice(),
                    req.getReason()
            );

            saleReturn.addItem(returnItem);
        });

        /* 4) Guardar */
        SaleReturn saved = saleReturnRepo.save(saleReturn);

        /* 5) DTO de respuesta */
        List<ReturnItemDto> itemDtos = saved.getItems().stream()
                .map(i -> new ReturnItemDto(
                        i.getId(),
                        i.getSaleItem().getId(),
                        i.getQuantity(),
                        i.getUnitPrice()))
                .collect(Collectors.toList());

        return new SaleReturnDto(
                saved.getId(),
                saved.getSale().getId(),
                saved.getReason(),
                saved.getReturnDate(),
                itemDtos
        );
    }

    /* ============================================================
     *  LISTAR DEVOLUCIONES POR SUCURSAL / FILTROS
     * ============================================================ */
    @Transactional(readOnly = true)
    public List<SaleReturnDto> listReturns(Long sucursalId,
                                           Long saleId,
                                           LocalDateTime from,
                                           LocalDateTime to) {

        if (!sucursalRepo.existsById(sucursalId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Sucursal no encontrada: " + sucursalId);
        }

        List<SaleReturn> returns = saleReturnRepo
                .findByFiltersSucursal(sucursalId, saleId, from, to);

        return returns.stream()
                .map(sr -> new SaleReturnDto(
                        sr.getId(),
                        sr.getSale().getId(),
                        sr.getReason(),
                        sr.getReturnDate(),
                        List.of()           // omitimos ítems en listados
                ))
                .collect(Collectors.toList());
    }
}
