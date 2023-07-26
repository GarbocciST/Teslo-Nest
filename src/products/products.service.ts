import { Injectable, InternalServerErrorException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product, ProductImage} from './entities';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');
  
  constructor(

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    
    @InjectRepository(ProductImage)
    private readonly productsImageRepository: Repository<ProductImage>,

    private readonly dataSoruce: DataSource,

  ) {}


  async create(createProductDto: CreateProductDto, user: User) {
    
    try {

      const {images = [], ...productDetails} = createProductDto;

      const product = this.productsRepository.create({
        ...productDetails,
        images: images.map( image => this.productsImageRepository.create({url: image}) ),
        user,
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

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
   
    const { images = [], ...productDetails } = updateProductDto;

    const product = await this.productsRepository.preload({ id, ...productDetails });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    
    // create query runner
    const queryRunner = this.dataSoruce.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    

    try {
      if( images) {
        await queryRunner.manager.delete(ProductImage, {product: {id}});

        product.images = images.map( 
          image => this.productsImageRepository.create({url: image}) 
        );
      }

      product.user = user;
      
      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlain(id);

    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();
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

  async deletAllProducts() {
    const query = this.productsRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();
        
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

}
