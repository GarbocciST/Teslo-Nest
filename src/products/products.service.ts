import { Injectable, InternalServerErrorException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductImage} from './entities';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');
  
  constructor(

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    
    @InjectRepository(ProductImage)
    private readonly productsImageRepository: Repository<ProductImage>,



  ) {}


  async create(createProductDto: CreateProductDto) {
    
    try {

      const {images = [], ...productDetails} = createProductDto;

      const product = this.productsRepository.create({
        ...productDetails,
        images: images.map( image => this.productsImageRepository.create({url: image}) )
      });
      await this.productsRepository.save(product);

      return {...product, images};
      
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // TODO: Implement pagination
  async findAll( paginationDto : PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productsRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    })

    return products.map( product => ({
      ...product,
      images: product.images.map( img => img.url )
    }) );
  }

  
  async findOne(term: string) {

    let product: Product;

    if (isUUID(term)) {
      product = await this.productsRepository.findOneBy({id: term});
    } else {
      const queryBuilder = this.productsRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('UPPER(title) = :title or slug = :slug', { 
          title: term.toUpperCase(), 
          slug: term.toLowerCase(), 
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
      // product = await this.productsRepository.findOneBy({slug: term});
    }

    if (!product) {
      throw new NotFoundException(`Product with id ${term} not found`);
    }
    return product;

  }

  async findOnePlain ( term : string ) {
    const {images =[], ...rest} = await this.findOne(term);
    
    return {...rest, images: images.map( img => img.url )};
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
   
    const product = await this.productsRepository.preload({
      id: id,
      ...updateProductDto,
      images: []
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    try {
          await this.productsRepository.save(product);
          return product;
    } catch (error) {
          this.handleDBExceptions(error);
    } 
  } 

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
    return ;
  }


  private handleDBExceptions(error: any) {

    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }

}
